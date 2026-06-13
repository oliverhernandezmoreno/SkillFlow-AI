import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/domain/errors.js';
import { createOrganizationSchema } from './interfaces/http/validators/organization.validators.js';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case.js';
import type { OrganizationRepository } from './domain/repositories/organization.repository.js';
import type { Organization } from './domain/entities/organization.entity.js';

class FakeOrganizationRepository implements OrganizationRepository {
  organizations: Organization[] = [];

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.find((organization) => organization.id === id) ?? null;
  }

  async findByTaxId(taxId: string): Promise<Organization | null> {
    return (
      this.organizations.find(
        (organization) => organization.toPrimitives().taxId === taxId,
      ) ?? null
    );
  }

  async search() {
    return { data: this.organizations, meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  async save(organization: Organization): Promise<void> {
    this.organizations.push(organization);
  }

  async update(organization: Organization): Promise<void> {
    this.organizations = this.organizations.map((current) =>
      current.id === organization.id ? organization : current,
    );
  }
}

describe('Organizations module', () => {
  it('validates create organization input', () => {
    expect(() =>
      createOrganizationSchema.parse({ name: 'ACME', taxId: '76123456-7', type: 'CLIENT' }),
    ).not.toThrow();
  });

  it('prevents duplicated tax IDs', async () => {
    const repository = new FakeOrganizationRepository();
    const useCase = new CreateOrganizationUseCase(repository);

    await useCase.execute({ name: 'ACME', taxId: '76123456-7', type: 'CLIENT' });

    await expect(
      useCase.execute({ name: 'ACME 2', taxId: '76123456-7', type: 'CLIENT' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
