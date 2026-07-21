import { describe, expect, it } from 'vitest';

import { OtecAccreditation } from './entities/otec-accreditation.entity.js';
import { LegalRepresentative } from './entities/legal-representative.entity.js';
import { OtecOffice } from './entities/otec-office.entity.js';
import { OtecProfile } from './entities/otec-profile.entity.js';
import { OtecResolution } from './entities/otec-resolution.entity.js';
import { QualityCertification } from './entities/quality-certification.entity.js';
import { DateRange } from './value-objects/date-range.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const profileId = '22222222-2222-4222-8222-222222222222';

describe('OTEC Compliance domain', () => {
  it('accepts an ordered date range and rejects a reversed date range', () => {
    const range = DateRange.create({
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2026-12-31T23:59:59.000Z'),
    });

    expect(range.isEffectiveAt(new Date('2026-07-16T00:00:00.000Z'))).toBe(true);
    expect(() =>
      DateRange.create({
        validFrom: new Date('2026-12-31T00:00:00.000Z'),
        validUntil: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).toThrow('validFrom cannot be later than validUntil');
  });

  it('creates and deactivates an OTEC profile with version traceability', () => {
    const profile = OtecProfile.create({ organizationId, registrationCode: 'DEMO-OTEC-001' });

    expect(profile.toPrimitives()).toMatchObject({ organizationId, version: 1, deletedAt: null });
    profile.deactivate();
    expect(profile.toPrimitives()).toMatchObject({ version: 2, registrationStatus: 'INACTIVE' });
    expect(profile.toPrimitives().deletedAt).toBeInstanceOf(Date);
  });

  it('suspends and revokes an accreditation through explicit transitions', () => {
    const accreditation = OtecAccreditation.create({
      organizationId,
      otecProfileId: profileId,
      accreditationType: 'OTEC_REGISTRATION',
      accreditationNumber: 'DEMO-ACC-001',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2027-01-01T00:00:00.000Z'),
    });

    accreditation.suspend(new Date('2026-07-16T00:00:00.000Z'));
    expect(accreditation.toPrimitives()).toMatchObject({ status: 'SUSPENDED', version: 2 });
    accreditation.revoke(new Date('2026-07-17T00:00:00.000Z'));
    expect(accreditation.toPrimitives()).toMatchObject({ status: 'REVOKED', version: 3 });
  });

  it('creates a quality certification without treating the number as official validation', () => {
    const certification = QualityCertification.create({
      organizationId,
      otecProfileId: profileId,
      certificationType: 'NCH_2728',
      certificationNumber: 'DEMO-NCH-001',
      certifyingEntity: 'Fictitious Quality Entity',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2027-01-01T00:00:00.000Z'),
    });

    expect(certification.toPrimitives()).toMatchObject({ status: 'ACTIVE', version: 1 });
  });

  it('deactivates an office so it cannot satisfy readiness', () => {
    const office = OtecOffice.create({
      organizationId,
      otecProfileId: profileId,
      officeCode: 'DEMO-HQ',
      name: 'Fictitious Headquarters',
      officeType: 'HEADQUARTERS',
      street: 'Demo Street 100',
      city: 'Santiago',
      commune: 'Santiago',
      region: 'Metropolitana',
      country: 'CL',
    });

    office.deactivate();
    expect(office.toPrimitives()).toMatchObject({ status: 'INACTIVE', version: 2 });
  });

  it('validates representative RUT syntax and normalizes email', () => {
    expect(() =>
      LegalRepresentative.create({
        organizationId,
        otecProfileId: profileId,
        firstName: 'Demo',
        lastName: 'Representative',
        taxId: 'invalid',
        email: 'representative@example.test',
        roleTitle: 'Legal Representative',
      }),
    ).toThrow('Invalid RUT');

    const representative = LegalRepresentative.create({
      organizationId,
      otecProfileId: profileId,
      firstName: 'Demo',
      lastName: 'Representative',
      taxId: '11111111-1',
      email: ' Representative@Example.Test ',
      roleTitle: 'Legal Representative',
    });
    expect(representative.toPrimitives()).toMatchObject({
      taxId: '111111111',
      email: 'representative@example.test',
      active: true,
    });
  });

  it('supersedes a resolution and rejects self-supersession', () => {
    const resolution = OtecResolution.create({
      organizationId,
      otecProfileId: profileId,
      resolutionType: 'ACCREDITATION',
      resolutionNumber: 'DEMO-RES-001',
      issuingAuthority: 'Fictitious Authority',
      issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(() => {
      resolution.supersede(resolution.id);
    }).toThrow('A resolution cannot supersede itself');
    resolution.supersede('33333333-3333-4333-8333-333333333333');
    expect(resolution.toPrimitives()).toMatchObject({
      supersedesResolutionId: '33333333-3333-4333-8333-333333333333',
      version: 2,
    });
  });
});
