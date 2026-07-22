import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migrationPath =
  'prisma/migrations/20260716223417_add_otec_compliance_foundation/migration.sql';
const backendCiWorkflow = readFileSync('.github/workflows/backend-ci.yml', 'utf8');

describe('OTEC Compliance Prisma schema', () => {
  it.each([
    'TenantModuleEntitlement',
    'OtecComplianceSettings',
    'OtecProfile',
    'OtecAccreditation',
    'QualityCertification',
    'OtecOffice',
    'LegalRepresentative',
    'OtecResolution',
  ])('defines the %s model', (modelName) => {
    expect(schema).toContain(`model ${modelName} {`);
  });

  it('defines tenant, status, validity, and soft-delete indexes', () => {
    expect(schema).toContain('@@index([organizationId, status])');
    expect(schema).toContain('@@index([organizationId, validUntil])');
    expect(schema).toContain('@@index([organizationId, deletedAt])');
  });

  it('adds partial unique indexes for active reusable identifiers', () => {
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('otec_profiles_one_active_per_organization');
    expect(migration).toContain('otec_accreditations_active_number_unique');
    expect(migration).toContain('quality_certifications_active_number_unique');
    expect(migration).toContain('otec_offices_active_code_unique');
    expect(migration).toContain('otec_resolutions_active_number_unique');
    expect(migration).toContain('WHERE "deleted_at" IS NULL');
  });

  it('deploys migrations before database-backed tests in backend CI', () => {
    const migrationStepIndex = backendCiWorkflow.indexOf('npm run prisma:migrate:deploy');
    const testStepIndex = backendCiWorkflow.indexOf('npm test');

    expect(migrationStepIndex).toBeGreaterThan(-1);
    expect(testStepIndex).toBeGreaterThan(migrationStepIndex);
  });
});
