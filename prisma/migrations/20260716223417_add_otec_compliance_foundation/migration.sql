-- CreateEnum
CREATE TYPE "ModuleCode" AS ENUM ('OTEC_COMPLIANCE');

-- CreateEnum
CREATE TYPE "ModuleEntitlementStatus" AS ENUM ('ENABLED', 'DISABLED', 'SUSPENDED', 'EXPIRED', 'PLAN_RESTRICTED');

-- CreateEnum
CREATE TYPE "OtecProfileStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CEASED');

-- CreateEnum
CREATE TYPE "OtecAccreditationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityCertificationType" AS ENUM ('NCH_2728', 'ISO_9001', 'OTHER');

-- CreateEnum
CREATE TYPE "QualityCertificationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OtecOfficeType" AS ENUM ('HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER');

-- CreateEnum
CREATE TYPE "OtecOfficeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OtecResolutionType" AS ENUM ('ACCREDITATION', 'AUTHORIZATION', 'MODIFICATION', 'SUSPENSION', 'CESSATION', 'OTHER');

-- CreateEnum
CREATE TYPE "OtecResolutionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "RuleValidationStatus" AS ENUM ('REQUIRES_FUNCTIONAL_VALIDATION', 'FUNCTIONALLY_VALIDATED', 'SUPERSEDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "UndatedRecordTreatment" AS ENUM ('BLOCKING', 'WARNING', 'ACCEPTED');

-- CreateTable
CREATE TABLE "tenant_module_entitlements" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "module_code" "ModuleCode" NOT NULL,
    "status" "ModuleEntitlementStatus" NOT NULL DEFAULT 'DISABLED',
    "enabled_features" JSONB NOT NULL DEFAULT '[]',
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "restriction_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tenant_module_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otec_profiles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "registration_code" TEXT,
    "status" "OtecProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "rudo_reference" TEXT,
    "accreditation_date" DATE,
    "suspension_date" DATE,
    "cessation_date" DATE,
    "technical_contact_name" TEXT,
    "technical_contact_email" TEXT,
    "technical_contact_phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "otec_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otec_compliance_settings" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "require_nch_2728" BOOLEAN NOT NULL DEFAULT false,
    "required_resolution_types" JSONB NOT NULL DEFAULT '[]',
    "qualifying_office_types" JSONB NOT NULL DEFAULT '[]',
    "expiration_warning_days" JSONB NOT NULL DEFAULT '[7,15,30,60]',
    "undated_record_treatment" "UndatedRecordTreatment" NOT NULL DEFAULT 'WARNING',
    "source_reference" TEXT,
    "source_version" TEXT,
    "validation_status" "RuleValidationStatus" NOT NULL DEFAULT 'REQUIRES_FUNCTIONAL_VALIDATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "otec_compliance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otec_accreditations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "accreditation_type" TEXT NOT NULL,
    "accreditation_number" TEXT NOT NULL,
    "status" "OtecAccreditationStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" DATE,
    "valid_from" DATE,
    "valid_until" DATE,
    "suspended_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "issuing_authority" TEXT,
    "source" TEXT,
    "external_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "otec_accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_certifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "certification_type" "QualityCertificationType" NOT NULL,
    "certification_number" TEXT NOT NULL,
    "certifying_entity" TEXT NOT NULL,
    "scope" TEXT,
    "issued_at" DATE,
    "valid_from" DATE,
    "valid_until" DATE,
    "status" "QualityCertificationStatus" NOT NULL DEFAULT 'DRAFT',
    "document_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quality_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otec_offices" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "office_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "office_type" "OtecOfficeType" NOT NULL,
    "status" "OtecOfficeStatus" NOT NULL DEFAULT 'DRAFT',
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CL',
    "postal_code" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "valid_from" DATE,
    "valid_until" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "otec_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_representatives" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role_title" TEXT NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "appointment_document_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "legal_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otec_resolutions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "otec_profile_id" UUID NOT NULL,
    "resolution_type" "OtecResolutionType" NOT NULL,
    "resolution_number" TEXT NOT NULL,
    "issuing_authority" TEXT NOT NULL,
    "issued_at" DATE NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "status" "OtecResolutionStatus" NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT,
    "supersedes_resolution_id" UUID,
    "document_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "otec_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_module_entitlements_organization_id_status_idx" ON "tenant_module_entitlements"("organization_id", "status");

-- CreateIndex
CREATE INDEX "tenant_module_entitlements_organization_id_valid_until_idx" ON "tenant_module_entitlements"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "tenant_module_entitlements_organization_id_deleted_at_idx" ON "tenant_module_entitlements"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_module_entitlements_id_organization_id_key" ON "tenant_module_entitlements"("id", "organization_id");

-- CreateIndex
CREATE INDEX "otec_profiles_organization_id_status_idx" ON "otec_profiles"("organization_id", "status");

-- CreateIndex
CREATE INDEX "otec_profiles_organization_id_deleted_at_idx" ON "otec_profiles"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "otec_profiles_id_organization_id_key" ON "otec_profiles"("id", "organization_id");

-- CreateIndex
CREATE INDEX "otec_compliance_settings_organization_id_effective_from_idx" ON "otec_compliance_settings"("organization_id", "effective_from");

-- CreateIndex
CREATE INDEX "otec_compliance_settings_organization_id_deleted_at_idx" ON "otec_compliance_settings"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "otec_compliance_settings_otec_profile_id_idx" ON "otec_compliance_settings"("otec_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "otec_compliance_settings_id_organization_id_key" ON "otec_compliance_settings"("id", "organization_id");

-- CreateIndex
CREATE INDEX "otec_accreditations_organization_id_status_idx" ON "otec_accreditations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "otec_accreditations_organization_id_valid_until_idx" ON "otec_accreditations"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "otec_accreditations_organization_id_deleted_at_idx" ON "otec_accreditations"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "otec_accreditations_otec_profile_id_idx" ON "otec_accreditations"("otec_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "otec_accreditations_id_organization_id_key" ON "otec_accreditations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "quality_certifications_organization_id_status_idx" ON "quality_certifications"("organization_id", "status");

-- CreateIndex
CREATE INDEX "quality_certifications_organization_id_valid_until_idx" ON "quality_certifications"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "quality_certifications_organization_id_deleted_at_idx" ON "quality_certifications"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "quality_certifications_otec_profile_id_idx" ON "quality_certifications"("otec_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_certifications_id_organization_id_key" ON "quality_certifications"("id", "organization_id");

-- CreateIndex
CREATE INDEX "otec_offices_organization_id_status_idx" ON "otec_offices"("organization_id", "status");

-- CreateIndex
CREATE INDEX "otec_offices_organization_id_valid_until_idx" ON "otec_offices"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "otec_offices_organization_id_deleted_at_idx" ON "otec_offices"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "otec_offices_otec_profile_id_idx" ON "otec_offices"("otec_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "otec_offices_id_organization_id_key" ON "otec_offices"("id", "organization_id");

-- CreateIndex
CREATE INDEX "legal_representatives_organization_id_active_idx" ON "legal_representatives"("organization_id", "active");

-- CreateIndex
CREATE INDEX "legal_representatives_organization_id_valid_until_idx" ON "legal_representatives"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "legal_representatives_organization_id_deleted_at_idx" ON "legal_representatives"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "legal_representatives_otec_profile_id_idx" ON "legal_representatives"("otec_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_representatives_id_organization_id_key" ON "legal_representatives"("id", "organization_id");

-- CreateIndex
CREATE INDEX "otec_resolutions_organization_id_status_idx" ON "otec_resolutions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "otec_resolutions_organization_id_valid_until_idx" ON "otec_resolutions"("organization_id", "valid_until");

-- CreateIndex
CREATE INDEX "otec_resolutions_organization_id_deleted_at_idx" ON "otec_resolutions"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "otec_resolutions_otec_profile_id_idx" ON "otec_resolutions"("otec_profile_id");

-- CreateIndex
CREATE INDEX "otec_resolutions_supersedes_resolution_id_idx" ON "otec_resolutions"("supersedes_resolution_id");

-- CreateIndex
CREATE UNIQUE INDEX "otec_resolutions_id_organization_id_key" ON "otec_resolutions"("id", "organization_id");

-- Enforce uniqueness only for records that remain operationally active.
-- These PostgreSQL partial indexes are intentionally maintained in SQL because
-- Prisma schema syntax cannot represent filtered uniqueness.
CREATE UNIQUE INDEX "tenant_module_entitlements_active_module_unique"
ON "tenant_module_entitlements"("organization_id", "module_code")
WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "otec_profiles_one_active_per_organization"
ON "otec_profiles"("organization_id")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "otec_accreditations_active_number_unique"
ON "otec_accreditations"("organization_id", "otec_profile_id", "accreditation_number")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "quality_certifications_active_number_unique"
ON "quality_certifications"("organization_id", "otec_profile_id", "certification_number")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "otec_offices_active_code_unique"
ON "otec_offices"("organization_id", "otec_profile_id", "office_code")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "otec_resolutions_active_number_unique"
ON "otec_resolutions"("organization_id", "otec_profile_id", "resolution_number")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "tenant_module_entitlements" ADD CONSTRAINT "tenant_module_entitlements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_profiles" ADD CONSTRAINT "otec_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_compliance_settings" ADD CONSTRAINT "otec_compliance_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_compliance_settings" ADD CONSTRAINT "otec_compliance_settings_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_accreditations" ADD CONSTRAINT "otec_accreditations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_accreditations" ADD CONSTRAINT "otec_accreditations_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_certifications" ADD CONSTRAINT "quality_certifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_certifications" ADD CONSTRAINT "quality_certifications_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_offices" ADD CONSTRAINT "otec_offices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_offices" ADD CONSTRAINT "otec_offices_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_representatives" ADD CONSTRAINT "legal_representatives_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_representatives" ADD CONSTRAINT "legal_representatives_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_resolutions" ADD CONSTRAINT "otec_resolutions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_resolutions" ADD CONSTRAINT "otec_resolutions_otec_profile_id_organization_id_fkey" FOREIGN KEY ("otec_profile_id", "organization_id") REFERENCES "otec_profiles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otec_resolutions" ADD CONSTRAINT "otec_resolutions_supersedes_resolution_id_organization_id_fkey" FOREIGN KEY ("supersedes_resolution_id", "organization_id") REFERENCES "otec_resolutions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
