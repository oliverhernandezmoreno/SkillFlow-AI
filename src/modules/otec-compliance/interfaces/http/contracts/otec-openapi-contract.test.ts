import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';

import { OTEC_HTTP_ROUTE_MANIFEST } from './otec-http-route-manifest.js';
import {
  createAccreditationBodySchema,
  createCertificationBodySchema,
  createOfficeBodySchema,
  createProfileBodySchema,
  createRepresentativeBodySchema,
  createResolutionBodySchema,
  readinessBodySchema,
  supersessionBodySchema,
  transitionBodySchema,
  updateAccreditationBodySchema,
  updateCertificationBodySchema,
  updateOfficeBodySchema,
  updateProfileBodySchema,
  updateRepresentativeBodySchema,
  updateResolutionBodySchema,
} from './otec-http-schemas.js';

const contract = readFileSync('docs/sence/OTEC_HTTP_CONTRACTS.openapi.yml', 'utf8');
const mainContract = readFileSync('docs/api-spec.yml', 'utf8');
const document = record(load(contract));

describe('OTEC productive OpenAPI contract', () => {
  it('declares only the registered resources as implemented', () => {
    for (const resource of [
      'profile',
      'accreditations',
      'quality-certifications',
      'offices',
      'legal-representatives',
      'resolutions',
      'readiness',
      'compliance-summary',
      'expiring-items',
    ])
      expect(contract).toContain(`/otec-compliance/${resource}`);
    expect(contract).toContain('x-contract-status: implemented');
    expect(contract).not.toContain('x-contract-status: design-only');
    expect(contract).not.toContain('/activity-validation');
  });

  it('declares security, permission, entitlement, pagination, errors, and concurrency', () => {
    expect(contract).toContain('bearerAuth');
    expect(contract).toContain('x-permission:');
    expect(contract).toContain('x-entitlement-feature:');
    expect(contract).toContain('maximum: 100');
    expect(contract).toContain('If-Match');
    for (const status of ['400', '403', '404', '409']) expect(contract).toContain(`'${status}'`);
  });

  it('uses a unique operationId for every registered operation', () => {
    const operationIds = [...contract.matchAll(/operationId:\s*([A-Za-z0-9]+)/g)].map(
      (match) => match[1],
    );
    expect(operationIds).toHaveLength(34);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('contains every productive method and path in the canonical route manifest', () => {
    for (const operation of OTEC_HTTP_ROUTE_MANIFEST) {
      const pathOffset = contract.indexOf(`  ${operation.path}:`);
      expect(pathOffset, operation.path).toBeGreaterThanOrEqual(0);
      const nextPathOffset = contract.indexOf('\n  /otec-compliance/', pathOffset + 1);
      const pathBlock = contract.slice(
        pathOffset,
        nextPathOffset === -1 ? contract.indexOf('\ncomponents:', pathOffset) : nextPathOffset,
      );
      expect(pathBlock, `${operation.method.toUpperCase()} ${operation.path}`).toContain(
        `    ${operation.method}:`,
      );
    }
  });

  it('links every productive OTEC path from the main API specification', () => {
    for (const path of new Set(OTEC_HTTP_ROUTE_MANIFEST.map((operation) => operation.path))) {
      expect(mainContract, path).toContain(`  ${path}:`);
      expect(mainContract, path).toContain('OTEC_HTTP_CONTRACTS.openapi.yml#/paths/');
    }
  });

  it('binds every body operation to a specific strict schema with a valid example', () => {
    for (const requestContract of requestContracts()) {
      const operation = findOperation(requestContract.operationId);
      const requestBody = dereference(record(operation['requestBody']));
      const mediaType = record(record(requestBody['content'])['application/json']);
      const schemaReference = String(record(mediaType['schema'])['$ref']);
      expect(schemaReference, requestContract.operationId).toBe(
        `#/components/schemas/${requestContract.schemaName}`,
      );
      const schema = componentSchema(requestContract.schemaName);
      expect(schema['additionalProperties'], requestContract.schemaName).toBe(false);
      expect(schema['example'], requestContract.schemaName).toEqual(requestContract.example);
      expect(() => requestContract.runtimeSchema.parse(schema['example'])).not.toThrow();
      for (const forbidden of [
        'organizationId',
        'tenantId',
        'actorId',
        'roles',
        'permissions',
        'entitlement',
        'expectedVersion',
      ]) {
        expect(record(schema['properties']), requestContract.schemaName).not.toHaveProperty(
          forbidden,
        );
      }
    }
    expect(contract).not.toContain('JsonBody');
  });

  it('documents the stable 400/409 policy without advertising 412 or 422', () => {
    expect(contract).toContain("'400':");
    expect(contract).toContain("'409':");
    expect(contract).not.toContain("'412':");
    expect(contract).not.toContain("'422':");
    expect(contract).toContain('Stale optimistic versions use HTTP 409');
  });

  it('uses specific success response components and the internal-readiness disclaimer', () => {
    for (const operation of operations()) {
      const responses = record(operation['responses']);
      const success = responses['200'] ?? responses['201'] ?? responses['204'];
      expect(success, String(operation['operationId'])).toBeDefined();
      if (responses['204'] === undefined) {
        expect(record(success)['$ref'], String(operation['operationId'])).toMatch(
          /^#\/components\/responses\/(Otec|Quality|Legal|Readiness|Compliance|Expiring)/,
        );
      }
    }
    expect(contract).toContain(
      'does not represent accreditation, authorization, or official SENCE approval',
    );
  });

  it('resolves every local reference and uses every declared component schema', () => {
    const references = collectReferences(document);
    for (const reference of references) {
      expect(() => dereference({ $ref: reference }), reference).not.toThrow();
    }
    for (const schemaName of Object.keys(record(record(document['components'])['schemas']))) {
      expect(references, schemaName).toContain(`#/components/schemas/${schemaName}`);
    }
  });

  it('keeps response schemas strict and excludes transport identity and soft-delete fields', () => {
    for (const schemaName of [
      'OtecProfile',
      'OtecAccreditation',
      'QualityCertification',
      'OtecOffice',
      'LegalRepresentative',
      'OtecResolution',
      'OtecReadinessResult',
      'OtecComplianceSummary',
      'ExpiringComplianceItem',
    ]) {
      const schema = componentSchema(schemaName);
      expect(schema['additionalProperties'], schemaName).toBe(false);
      const properties = record(schema['properties']);
      for (const forbidden of ['organizationId', 'tenantId', 'actorId', 'deletedAt']) {
        expect(properties, schemaName).not.toHaveProperty(forbidden);
      }
    }
  });

  it('defines the exclusive public readiness finding identity as code', () => {
    const finding = componentSchema('ReadinessFinding');
    const properties = record(finding['properties']);

    expect(finding['required']).toContain('code');
    expect(properties['code']).toMatchObject({ type: 'string' });
    expect(properties).not.toHaveProperty('ruleCode');
  });
});

interface RequestContract {
  operationId: string;
  schemaName: string;
  runtimeSchema: ZodType<unknown>;
  example: Record<string, unknown>;
}

function requestContracts(): RequestContract[] {
  const profileId = '10000000-0000-4000-8000-000000000001';
  const replacementId = '10000000-0000-4000-8000-000000000002';
  const transition = {
    schemaName: 'OtecTransitionRequest',
    runtimeSchema: transitionBodySchema,
    example: { reason: 'Internal review' },
  };
  return [
    contractRequest('createOtecProfile', 'CreateOtecProfileRequest', createProfileBodySchema, {
      registrationCode: 'OTEC-DEMO-001',
    }),
    contractRequest('updateOtecProfile', 'UpdateOtecProfileRequest', updateProfileBodySchema, {
      notes: 'Updated internal evidence',
    }),
    ...[
      'deactivateOtecProfile',
      'suspendOtecAccreditation',
      'revokeOtecAccreditation',
      'deactivateQualityCertification',
      'deactivateOtecOffice',
      'deactivateLegalRepresentative',
      'deactivateOtecResolution',
    ].map((operationId) => ({ operationId, ...transition })),
    contractRequest(
      'createOtecAccreditation',
      'CreateOtecAccreditationRequest',
      createAccreditationBodySchema,
      {
        otecProfileId: profileId,
        accreditationType: 'INTERNAL_REGISTRATION',
        accreditationNumber: 'ACC-DEMO-001',
      },
    ),
    contractRequest(
      'updateOtecAccreditation',
      'UpdateOtecAccreditationRequest',
      updateAccreditationBodySchema,
      { notes: 'Evidence reviewed' },
    ),
    contractRequest(
      'createQualityCertification',
      'CreateQualityCertificationRequest',
      createCertificationBodySchema,
      {
        otecProfileId: profileId,
        certificationType: 'NCH_2728',
        certificationNumber: 'CERT-DEMO-001',
        certifyingEntity: 'Fictitious Certification Entity',
      },
    ),
    contractRequest(
      'updateQualityCertification',
      'UpdateQualityCertificationRequest',
      updateCertificationBodySchema,
      { scope: 'Internal training services' },
    ),
    contractRequest('createOtecOffice', 'CreateOtecOfficeRequest', createOfficeBodySchema, {
      otecProfileId: profileId,
      officeCode: 'HQ-DEMO',
      name: 'Fictitious Headquarters',
      officeType: 'HEADQUARTERS',
      street: 'Test Street 1',
      city: 'Santiago',
      commune: 'Santiago',
      region: 'Metropolitana',
      country: 'CL',
    }),
    contractRequest('updateOtecOffice', 'UpdateOtecOfficeRequest', updateOfficeBodySchema, {
      name: 'Updated Fictitious Headquarters',
    }),
    contractRequest(
      'createLegalRepresentative',
      'CreateLegalRepresentativeRequest',
      createRepresentativeBodySchema,
      {
        otecProfileId: profileId,
        firstName: 'Fictitious',
        lastName: 'Representative',
        taxId: '12.345.678-5',
        roleTitle: 'Legal Representative',
      },
    ),
    contractRequest(
      'updateLegalRepresentative',
      'UpdateLegalRepresentativeRequest',
      updateRepresentativeBodySchema,
      { roleTitle: 'Acting Legal Representative' },
    ),
    contractRequest(
      'createOtecResolution',
      'CreateOtecResolutionRequest',
      createResolutionBodySchema,
      {
        otecProfileId: profileId,
        resolutionType: 'AUTHORIZATION',
        resolutionNumber: 'RES-DEMO-001',
        issuingAuthority: 'Fictitious Internal Authority',
        issuedAt: '2026-01-01',
      },
    ),
    contractRequest(
      'updateOtecResolution',
      'UpdateOtecResolutionRequest',
      updateResolutionBodySchema,
      { notes: 'Internal evidence reviewed' },
    ),
    contractRequest(
      'supersedeOtecResolution',
      'SupersedeOtecResolutionRequest',
      supersessionBodySchema,
      {
        replacementResolutionId: replacementId,
        replacementIfMatch: 'W/"v1"',
        reason: 'Replaced by newer internal evidence',
      },
    ),
    contractRequest('evaluateOtecReadiness', 'EvaluateOtecReadinessRequest', readinessBodySchema, {
      otecProfileId: profileId,
      evaluationDate: '2026-07-17',
    }),
  ];
}

function contractRequest(
  operationId: string,
  schemaName: string,
  runtimeSchema: ZodType<unknown>,
  example: Record<string, unknown>,
): RequestContract {
  return { operationId, schemaName, runtimeSchema, example };
}

function operations(): Record<string, unknown>[] {
  return Object.values(record(document['paths'])).flatMap((pathItem) =>
    Object.values(record(pathItem)).map(record),
  );
}

function findOperation(operationId: string): Record<string, unknown> {
  const operation = operations().find((candidate) => candidate['operationId'] === operationId);
  if (!operation) throw new Error(`Missing OpenAPI operation ${operationId}`);
  return operation;
}

function componentSchema(name: string): Record<string, unknown> {
  return record(record(record(document['components'])['schemas'])[name]);
}

function dereference(reference: Record<string, unknown>): Record<string, unknown> {
  const path = String(reference['$ref']).replace(/^#\//, '').split('/');
  return path.reduce((value, segment) => record(value[segment]), document);
}

function collectReferences(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectReferences);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    key === '$ref' && typeof nested === 'string' && nested.startsWith('#/')
      ? [nested]
      : collectReferences(nested),
  );
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an OpenAPI object');
  }
  return value as Record<string, unknown>;
}
