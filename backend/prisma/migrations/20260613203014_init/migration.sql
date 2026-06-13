-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('CLIENT', 'CLIENT_COMPANY', 'OTEC', 'PROVIDER', 'HOLDING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED', 'LOCKED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('OTEC', 'INSTRUCTOR', 'CONSULTANT', 'PLATFORM', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseModality" AS ENUM ('ONLINE', 'PRESENTIAL', 'HYBRID', 'BLENDED', 'ASYNC');

-- CreateEnum
CREATE TYPE "TrainingPlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'ENROLLED', 'CANCELLED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'DIGITAL_SIGNATURE', 'MANUAL', 'BIOMETRIC');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('KNOWLEDGE', 'KNOWLEDGE_TEST', 'SATISFACTION', 'SATISFACTION_SURVEY', 'PRACTICAL', 'PRACTICAL_ASSESSMENT', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "EvaluationQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'NUMERIC', 'SCALE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'ISSUED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SenceDeclarationStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'OBSERVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ATTENDANCE_EVIDENCE', 'ATTENDANCE_SHEET', 'CERTIFICATE', 'CONTRACT', 'COURSE_MATERIAL', 'EVALUATION', 'SENCE_EVIDENCE', 'SENCE_FILE', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportSnapshotType" AS ENUM ('DASHBOARD', 'TRAINING_COMPLIANCE', 'SENCE', 'COSTS', 'AUDIT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "tax_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "industry" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CL',
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "rut" TEXT NOT NULL,
    "employee_code" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "normalized_email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "area_id" UUID,
    "area_name" TEXT,
    "position" TEXT,
    "position_id" UUID,
    "position_name" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "hired_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" "ProviderType" NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "tax_id" TEXT,
    "email" TEXT,
    "normalized_email" TEXT,
    "phone" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "provider_id" UUID,
    "rut" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "normalized_email" TEXT,
    "phone" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modality" "CourseModality" NOT NULL,
    "duration_hours" DECIMAL(8,2) NOT NULL,
    "validity_months" INTEGER,
    "sence_code" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "duration_hours" DECIMAL(8,2),
    "content_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencies" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_competencies" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "course_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "budget_amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "status" "TrainingPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "training_plan_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "planned_month" INTEGER,
    "quarter" INTEGER,
    "estimated_participants" INTEGER NOT NULL,
    "estimated_cost" DECIMAL(14,2) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "business_justification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "training_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "training_plan_item_id" UUID,
    "provider_id" UUID,
    "instructor_id" UUID,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "cost_amount" DECIMAL(14,2),
    "meeting_url" TEXT,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "training_session_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_percentage" DECIMAL(5,2),
    "final_score" DECIMAL(5,2),
    "approved" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "training_session_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "method" "AttendanceMethod" NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "evidence_document_id" UUID,
    "qr_token" TEXT,
    "signature_storage_key" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "training_session_id" UUID NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passing_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_questions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "evaluation_id" UUID NOT NULL,
    "type" "EvaluationQuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "question_text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB,
    "points" DECIMAL(8,2),
    "order_index" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evaluation_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_responses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "evaluation_id" UUID NOT NULL,
    "enrollment_id" UUID,
    "employee_id" UUID NOT NULL,
    "score" DECIMAL(5,2),
    "passed" BOOLEAN,
    "answers_payload" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evaluation_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_answers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "evaluation_response_id" UUID NOT NULL,
    "evaluation_question_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "answer" JSONB NOT NULL,
    "score" DECIMAL(8,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evaluation_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "enrollment_id" UUID,
    "employee_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "training_session_id" UUID NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ISSUED',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATE,
    "file_url" TEXT,
    "document_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sence_declarations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "training_session_id" UUID NOT NULL,
    "sence_code" TEXT,
    "status" "SenceDeclarationStatus" NOT NULL DEFAULT 'DRAFT',
    "declared_amount" DECIMAL(14,2),
    "tax_credit_amount" DECIMAL(14,2),
    "external_code" TEXT,
    "submitted_at" TIMESTAMP(3),
    "response_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "sence_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sence_documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sence_declaration_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "document_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "sence_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "mime_type" TEXT,
    "storage_key" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "type" "ReportSnapshotType" NOT NULL,
    "name" TEXT NOT NULL,
    "period_from" DATE,
    "period_to" DATE,
    "filters" JSONB,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tax_id_key" ON "organizations"("tax_id");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE INDEX "organizations_tax_id_idx" ON "organizations"("tax_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_status_idx" ON "users"("organization_id", "status");

-- CreateIndex
CREATE INDEX "users_organization_id_created_at_idx" ON "users"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "users_organization_id_deleted_at_idx" ON "users"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "users_organization_id_status_created_at_idx" ON "users"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_normalized_email_key" ON "users"("organization_id", "normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_organization_id_key" ON "users"("id", "organization_id");

-- CreateIndex
CREATE INDEX "roles_organization_id_idx" ON "roles"("organization_id");

-- CreateIndex
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE INDEX "roles_deleted_at_idx" ON "roles"("deleted_at");

-- CreateIndex
CREATE INDEX "roles_code_idx" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_code_key" ON "roles"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_organization_id_key" ON "roles"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_created_at_idx" ON "permissions"("created_at");

-- CreateIndex
CREATE INDEX "permissions_deleted_at_idx" ON "permissions"("deleted_at");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_id_key" ON "permissions"("id");

-- CreateIndex
CREATE INDEX "user_roles_organization_id_idx" ON "user_roles"("organization_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_created_at_idx" ON "user_roles"("created_at");

-- CreateIndex
CREATE INDEX "user_roles_deleted_at_idx" ON "user_roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_id_organization_id_key" ON "user_roles"("id", "organization_id");

-- CreateIndex
CREATE INDEX "role_permissions_organization_id_idx" ON "role_permissions"("organization_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "role_permissions_created_at_idx" ON "role_permissions"("created_at");

-- CreateIndex
CREATE INDEX "role_permissions_deleted_at_idx" ON "role_permissions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_id_organization_id_key" ON "role_permissions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "employees_organization_id_idx" ON "employees"("organization_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_last_name_first_name_idx" ON "employees"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "employees_area_id_idx" ON "employees"("area_id");

-- CreateIndex
CREATE INDEX "employees_position_id_idx" ON "employees"("position_id");

-- CreateIndex
CREATE INDEX "employees_organization_id_status_idx" ON "employees"("organization_id", "status");

-- CreateIndex
CREATE INDEX "employees_organization_id_created_at_idx" ON "employees"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "employees_organization_id_deleted_at_idx" ON "employees"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_organization_id_status_created_at_idx" ON "employees"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organization_id_rut_key" ON "employees"("organization_id", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organization_id_normalized_email_key" ON "employees"("organization_id", "normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organization_id_employee_code_key" ON "employees"("organization_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_id_organization_id_key" ON "employees"("id", "organization_id");

-- CreateIndex
CREATE INDEX "providers_organization_id_idx" ON "providers"("organization_id");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- CreateIndex
CREATE INDEX "providers_type_idx" ON "providers"("type");

-- CreateIndex
CREATE INDEX "providers_created_at_idx" ON "providers"("created_at");

-- CreateIndex
CREATE INDEX "providers_deleted_at_idx" ON "providers"("deleted_at");

-- CreateIndex
CREATE INDEX "providers_legal_name_idx" ON "providers"("legal_name");

-- CreateIndex
CREATE INDEX "providers_organization_id_status_idx" ON "providers"("organization_id", "status");

-- CreateIndex
CREATE INDEX "providers_organization_id_created_at_idx" ON "providers"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "providers_organization_id_deleted_at_idx" ON "providers"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "providers_organization_id_status_created_at_idx" ON "providers"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "providers_organization_id_tax_id_key" ON "providers"("organization_id", "tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "providers_organization_id_normalized_email_key" ON "providers"("organization_id", "normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "providers_id_organization_id_key" ON "providers"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_user_id_key" ON "instructors"("user_id");

-- CreateIndex
CREATE INDEX "instructors_organization_id_idx" ON "instructors"("organization_id");

-- CreateIndex
CREATE INDEX "instructors_status_idx" ON "instructors"("status");

-- CreateIndex
CREATE INDEX "instructors_provider_id_idx" ON "instructors"("provider_id");

-- CreateIndex
CREATE INDEX "instructors_created_at_idx" ON "instructors"("created_at");

-- CreateIndex
CREATE INDEX "instructors_deleted_at_idx" ON "instructors"("deleted_at");

-- CreateIndex
CREATE INDEX "instructors_last_name_first_name_idx" ON "instructors"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "instructors_organization_id_status_idx" ON "instructors"("organization_id", "status");

-- CreateIndex
CREATE INDEX "instructors_organization_id_created_at_idx" ON "instructors"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "instructors_organization_id_deleted_at_idx" ON "instructors"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "instructors_organization_id_status_created_at_idx" ON "instructors"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_user_id_organization_id_key" ON "instructors"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_organization_id_rut_key" ON "instructors"("organization_id", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_organization_id_normalized_email_key" ON "instructors"("organization_id", "normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_id_organization_id_key" ON "instructors"("id", "organization_id");

-- CreateIndex
CREATE INDEX "courses_organization_id_idx" ON "courses"("organization_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_created_at_idx" ON "courses"("created_at");

-- CreateIndex
CREATE INDEX "courses_deleted_at_idx" ON "courses"("deleted_at");

-- CreateIndex
CREATE INDEX "courses_modality_idx" ON "courses"("modality");

-- CreateIndex
CREATE INDEX "courses_name_idx" ON "courses"("name");

-- CreateIndex
CREATE INDEX "courses_organization_id_status_idx" ON "courses"("organization_id", "status");

-- CreateIndex
CREATE INDEX "courses_organization_id_created_at_idx" ON "courses"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "courses_organization_id_deleted_at_idx" ON "courses"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "courses_organization_id_status_created_at_idx" ON "courses"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "courses_organization_id_code_key" ON "courses"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_id_organization_id_key" ON "courses"("id", "organization_id");

-- CreateIndex
CREATE INDEX "course_modules_organization_id_idx" ON "course_modules"("organization_id");

-- CreateIndex
CREATE INDEX "course_modules_course_id_idx" ON "course_modules"("course_id");

-- CreateIndex
CREATE INDEX "course_modules_created_at_idx" ON "course_modules"("created_at");

-- CreateIndex
CREATE INDEX "course_modules_deleted_at_idx" ON "course_modules"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_order_index_key" ON "course_modules"("course_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_id_organization_id_key" ON "course_modules"("id", "organization_id");

-- CreateIndex
CREATE INDEX "competencies_organization_id_idx" ON "competencies"("organization_id");

-- CreateIndex
CREATE INDEX "competencies_created_at_idx" ON "competencies"("created_at");

-- CreateIndex
CREATE INDEX "competencies_deleted_at_idx" ON "competencies"("deleted_at");

-- CreateIndex
CREATE INDEX "competencies_name_idx" ON "competencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "competencies_organization_id_code_key" ON "competencies"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "competencies_id_organization_id_key" ON "competencies"("id", "organization_id");

-- CreateIndex
CREATE INDEX "course_competencies_organization_id_idx" ON "course_competencies"("organization_id");

-- CreateIndex
CREATE INDEX "course_competencies_course_id_idx" ON "course_competencies"("course_id");

-- CreateIndex
CREATE INDEX "course_competencies_competency_id_idx" ON "course_competencies"("competency_id");

-- CreateIndex
CREATE INDEX "course_competencies_created_at_idx" ON "course_competencies"("created_at");

-- CreateIndex
CREATE INDEX "course_competencies_deleted_at_idx" ON "course_competencies"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_competencies_course_id_competency_id_key" ON "course_competencies"("course_id", "competency_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_competencies_id_organization_id_key" ON "course_competencies"("id", "organization_id");

-- CreateIndex
CREATE INDEX "training_plans_organization_id_idx" ON "training_plans"("organization_id");

-- CreateIndex
CREATE INDEX "training_plans_status_idx" ON "training_plans"("status");

-- CreateIndex
CREATE INDEX "training_plans_created_at_idx" ON "training_plans"("created_at");

-- CreateIndex
CREATE INDEX "training_plans_deleted_at_idx" ON "training_plans"("deleted_at");

-- CreateIndex
CREATE INDEX "training_plans_year_idx" ON "training_plans"("year");

-- CreateIndex
CREATE INDEX "training_plans_organization_id_status_idx" ON "training_plans"("organization_id", "status");

-- CreateIndex
CREATE INDEX "training_plans_organization_id_created_at_idx" ON "training_plans"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "training_plans_organization_id_deleted_at_idx" ON "training_plans"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "training_plans_organization_id_status_created_at_idx" ON "training_plans"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_organization_id_year_key" ON "training_plans"("organization_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_id_organization_id_key" ON "training_plans"("id", "organization_id");

-- CreateIndex
CREATE INDEX "training_plan_items_organization_id_idx" ON "training_plan_items"("organization_id");

-- CreateIndex
CREATE INDEX "training_plan_items_training_plan_id_idx" ON "training_plan_items"("training_plan_id");

-- CreateIndex
CREATE INDEX "training_plan_items_course_id_idx" ON "training_plan_items"("course_id");

-- CreateIndex
CREATE INDEX "training_plan_items_created_at_idx" ON "training_plan_items"("created_at");

-- CreateIndex
CREATE INDEX "training_plan_items_deleted_at_idx" ON "training_plan_items"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_plan_items_training_plan_id_course_id_key" ON "training_plan_items"("training_plan_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_plan_items_id_organization_id_key" ON "training_plan_items"("id", "organization_id");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_idx" ON "training_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "training_sessions_status_idx" ON "training_sessions"("status");

-- CreateIndex
CREATE INDEX "training_sessions_created_at_idx" ON "training_sessions"("created_at");

-- CreateIndex
CREATE INDEX "training_sessions_deleted_at_idx" ON "training_sessions"("deleted_at");

-- CreateIndex
CREATE INDEX "training_sessions_course_id_idx" ON "training_sessions"("course_id");

-- CreateIndex
CREATE INDEX "training_sessions_training_plan_item_id_idx" ON "training_sessions"("training_plan_item_id");

-- CreateIndex
CREATE INDEX "training_sessions_provider_id_idx" ON "training_sessions"("provider_id");

-- CreateIndex
CREATE INDEX "training_sessions_instructor_id_idx" ON "training_sessions"("instructor_id");

-- CreateIndex
CREATE INDEX "training_sessions_start_date_idx" ON "training_sessions"("start_date");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_status_idx" ON "training_sessions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_created_at_idx" ON "training_sessions"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_deleted_at_idx" ON "training_sessions"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_status_created_at_idx" ON "training_sessions"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_sessions_id_organization_id_key" ON "training_sessions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "enrollments_organization_id_idx" ON "enrollments"("organization_id");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE INDEX "enrollments_created_at_idx" ON "enrollments"("created_at");

-- CreateIndex
CREATE INDEX "enrollments_deleted_at_idx" ON "enrollments"("deleted_at");

-- CreateIndex
CREATE INDEX "enrollments_training_session_id_idx" ON "enrollments"("training_session_id");

-- CreateIndex
CREATE INDEX "enrollments_employee_id_idx" ON "enrollments"("employee_id");

-- CreateIndex
CREATE INDEX "enrollments_organization_id_status_idx" ON "enrollments"("organization_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_organization_id_created_at_idx" ON "enrollments"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "enrollments_organization_id_deleted_at_idx" ON "enrollments"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "enrollments_organization_id_status_created_at_idx" ON "enrollments"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_training_session_id_employee_id_key" ON "enrollments"("training_session_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_id_organization_id_key" ON "enrollments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "attendance_records_organization_id_idx" ON "attendance_records"("organization_id");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE INDEX "attendance_records_created_at_idx" ON "attendance_records"("created_at");

-- CreateIndex
CREATE INDEX "attendance_records_deleted_at_idx" ON "attendance_records"("deleted_at");

-- CreateIndex
CREATE INDEX "attendance_records_enrollment_id_idx" ON "attendance_records"("enrollment_id");

-- CreateIndex
CREATE INDEX "attendance_records_training_session_id_idx" ON "attendance_records"("training_session_id");

-- CreateIndex
CREATE INDEX "attendance_records_employee_id_idx" ON "attendance_records"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_records_evidence_document_id_idx" ON "attendance_records"("evidence_document_id");

-- CreateIndex
CREATE INDEX "attendance_records_check_in_at_idx" ON "attendance_records"("check_in_at");

-- CreateIndex
CREATE INDEX "attendance_records_organization_id_status_idx" ON "attendance_records"("organization_id", "status");

-- CreateIndex
CREATE INDEX "attendance_records_organization_id_created_at_idx" ON "attendance_records"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "attendance_records_organization_id_deleted_at_idx" ON "attendance_records"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "attendance_records_organization_id_status_created_at_idx" ON "attendance_records"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_id_organization_id_key" ON "attendance_records"("id", "organization_id");

-- CreateIndex
CREATE INDEX "evaluations_organization_id_idx" ON "evaluations"("organization_id");

-- CreateIndex
CREATE INDEX "evaluations_type_idx" ON "evaluations"("type");

-- CreateIndex
CREATE INDEX "evaluations_created_at_idx" ON "evaluations"("created_at");

-- CreateIndex
CREATE INDEX "evaluations_deleted_at_idx" ON "evaluations"("deleted_at");

-- CreateIndex
CREATE INDEX "evaluations_training_session_id_idx" ON "evaluations"("training_session_id");

-- CreateIndex
CREATE INDEX "evaluations_organization_id_created_at_idx" ON "evaluations"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "evaluations_organization_id_deleted_at_idx" ON "evaluations"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_id_organization_id_key" ON "evaluations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "evaluation_questions_organization_id_idx" ON "evaluation_questions"("organization_id");

-- CreateIndex
CREATE INDEX "evaluation_questions_evaluation_id_idx" ON "evaluation_questions"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_questions_created_at_idx" ON "evaluation_questions"("created_at");

-- CreateIndex
CREATE INDEX "evaluation_questions_deleted_at_idx" ON "evaluation_questions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_questions_evaluation_id_order_index_key" ON "evaluation_questions"("evaluation_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_questions_id_organization_id_key" ON "evaluation_questions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "evaluation_responses_organization_id_idx" ON "evaluation_responses"("organization_id");

-- CreateIndex
CREATE INDEX "evaluation_responses_created_at_idx" ON "evaluation_responses"("created_at");

-- CreateIndex
CREATE INDEX "evaluation_responses_deleted_at_idx" ON "evaluation_responses"("deleted_at");

-- CreateIndex
CREATE INDEX "evaluation_responses_evaluation_id_idx" ON "evaluation_responses"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_responses_enrollment_id_idx" ON "evaluation_responses"("enrollment_id");

-- CreateIndex
CREATE INDEX "evaluation_responses_employee_id_idx" ON "evaluation_responses"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_responses_evaluation_id_employee_id_key" ON "evaluation_responses"("evaluation_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_responses_id_organization_id_key" ON "evaluation_responses"("id", "organization_id");

-- CreateIndex
CREATE INDEX "evaluation_answers_organization_id_idx" ON "evaluation_answers"("organization_id");

-- CreateIndex
CREATE INDEX "evaluation_answers_created_at_idx" ON "evaluation_answers"("created_at");

-- CreateIndex
CREATE INDEX "evaluation_answers_deleted_at_idx" ON "evaluation_answers"("deleted_at");

-- CreateIndex
CREATE INDEX "evaluation_answers_evaluation_response_id_idx" ON "evaluation_answers"("evaluation_response_id");

-- CreateIndex
CREATE INDEX "evaluation_answers_evaluation_question_id_idx" ON "evaluation_answers"("evaluation_question_id");

-- CreateIndex
CREATE INDEX "evaluation_answers_employee_id_idx" ON "evaluation_answers"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_answers_evaluation_response_id_evaluation_questi_key" ON "evaluation_answers"("evaluation_response_id", "evaluation_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_answers_id_organization_id_key" ON "evaluation_answers"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- CreateIndex
CREATE INDEX "certificates_organization_id_idx" ON "certificates"("organization_id");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "certificates_created_at_idx" ON "certificates"("created_at");

-- CreateIndex
CREATE INDEX "certificates_deleted_at_idx" ON "certificates"("deleted_at");

-- CreateIndex
CREATE INDEX "certificates_enrollment_id_idx" ON "certificates"("enrollment_id");

-- CreateIndex
CREATE INDEX "certificates_employee_id_idx" ON "certificates"("employee_id");

-- CreateIndex
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");

-- CreateIndex
CREATE INDEX "certificates_training_session_id_idx" ON "certificates"("training_session_id");

-- CreateIndex
CREATE INDEX "certificates_document_id_idx" ON "certificates"("document_id");

-- CreateIndex
CREATE INDEX "certificates_issued_at_idx" ON "certificates"("issued_at");

-- CreateIndex
CREATE INDEX "certificates_organization_id_status_idx" ON "certificates"("organization_id", "status");

-- CreateIndex
CREATE INDEX "certificates_organization_id_created_at_idx" ON "certificates"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "certificates_organization_id_deleted_at_idx" ON "certificates"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "certificates_organization_id_status_created_at_idx" ON "certificates"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_id_organization_id_key" ON "certificates"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sence_declarations_organization_id_idx" ON "sence_declarations"("organization_id");

-- CreateIndex
CREATE INDEX "sence_declarations_status_idx" ON "sence_declarations"("status");

-- CreateIndex
CREATE INDEX "sence_declarations_created_at_idx" ON "sence_declarations"("created_at");

-- CreateIndex
CREATE INDEX "sence_declarations_deleted_at_idx" ON "sence_declarations"("deleted_at");

-- CreateIndex
CREATE INDEX "sence_declarations_training_session_id_idx" ON "sence_declarations"("training_session_id");

-- CreateIndex
CREATE INDEX "sence_declarations_sence_code_idx" ON "sence_declarations"("sence_code");

-- CreateIndex
CREATE INDEX "sence_declarations_organization_id_status_idx" ON "sence_declarations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "sence_declarations_organization_id_created_at_idx" ON "sence_declarations"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sence_declarations_organization_id_deleted_at_idx" ON "sence_declarations"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "sence_declarations_organization_id_status_created_at_idx" ON "sence_declarations"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sence_declarations_organization_id_training_session_id_key" ON "sence_declarations"("organization_id", "training_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "sence_declarations_id_organization_id_key" ON "sence_declarations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sence_documents_organization_id_idx" ON "sence_documents"("organization_id");

-- CreateIndex
CREATE INDEX "sence_documents_created_at_idx" ON "sence_documents"("created_at");

-- CreateIndex
CREATE INDEX "sence_documents_deleted_at_idx" ON "sence_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "sence_documents_sence_declaration_id_idx" ON "sence_documents"("sence_declaration_id");

-- CreateIndex
CREATE INDEX "sence_documents_document_id_idx" ON "sence_documents"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "sence_documents_sence_declaration_id_document_id_key" ON "sence_documents"("sence_declaration_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "sence_documents_id_organization_id_key" ON "sence_documents"("id", "organization_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");

-- CreateIndex
CREATE INDEX "documents_deleted_at_idx" ON "documents"("deleted_at");

-- CreateIndex
CREATE INDEX "documents_uploaded_by_user_id_idx" ON "documents"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "documents_file_name_idx" ON "documents"("file_name");

-- CreateIndex
CREATE INDEX "documents_organization_id_created_at_idx" ON "documents"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "documents_organization_id_deleted_at_idx" ON "documents"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_id_organization_id_key" ON "documents"("id", "organization_id");

-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_organization_id_status_idx" ON "notifications"("organization_id", "status");

-- CreateIndex
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_deleted_at_idx" ON "notifications"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_status_created_at_idx" ON "notifications"("organization_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_id_organization_id_key" ON "notifications"("id", "organization_id");

-- CreateIndex
CREATE INDEX "report_snapshots_organization_id_idx" ON "report_snapshots"("organization_id");

-- CreateIndex
CREATE INDEX "report_snapshots_type_idx" ON "report_snapshots"("type");

-- CreateIndex
CREATE INDEX "report_snapshots_created_at_idx" ON "report_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "report_snapshots_deleted_at_idx" ON "report_snapshots"("deleted_at");

-- CreateIndex
CREATE INDEX "report_snapshots_created_by_user_id_idx" ON "report_snapshots"("created_by_user_id");

-- CreateIndex
CREATE INDEX "report_snapshots_period_from_period_to_idx" ON "report_snapshots"("period_from", "period_to");

-- CreateIndex
CREATE UNIQUE INDEX "report_snapshots_id_organization_id_key" ON "report_snapshots"("id", "organization_id");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_idx" ON "audit_events"("organization_id");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- CreateIndex
CREATE INDEX "audit_events_deleted_at_idx" ON "audit_events"("deleted_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_created_at_idx" ON "audit_events"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_deleted_at_idx" ON "audit_events"("organization_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_organization_id_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_organization_id_fkey" FOREIGN KEY ("role_id", "organization_id") REFERENCES "roles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_organization_id_fkey" FOREIGN KEY ("role_id", "organization_id") REFERENCES "roles"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_organization_id_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_provider_id_organization_id_fkey" FOREIGN KEY ("provider_id", "organization_id") REFERENCES "providers"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_organization_id_fkey" FOREIGN KEY ("course_id", "organization_id") REFERENCES "courses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_competencies" ADD CONSTRAINT "course_competencies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_competencies" ADD CONSTRAINT "course_competencies_course_id_organization_id_fkey" FOREIGN KEY ("course_id", "organization_id") REFERENCES "courses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_competencies" ADD CONSTRAINT "course_competencies_competency_id_organization_id_fkey" FOREIGN KEY ("competency_id", "organization_id") REFERENCES "competencies"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_training_plan_id_organization_id_fkey" FOREIGN KEY ("training_plan_id", "organization_id") REFERENCES "training_plans"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_course_id_organization_id_fkey" FOREIGN KEY ("course_id", "organization_id") REFERENCES "courses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_course_id_organization_id_fkey" FOREIGN KEY ("course_id", "organization_id") REFERENCES "courses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_training_plan_item_id_organization_id_fkey" FOREIGN KEY ("training_plan_item_id", "organization_id") REFERENCES "training_plan_items"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_provider_id_organization_id_fkey" FOREIGN KEY ("provider_id", "organization_id") REFERENCES "providers"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_instructor_id_organization_id_fkey" FOREIGN KEY ("instructor_id", "organization_id") REFERENCES "instructors"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_training_session_id_organization_id_fkey" FOREIGN KEY ("training_session_id", "organization_id") REFERENCES "training_sessions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_employee_id_organization_id_fkey" FOREIGN KEY ("employee_id", "organization_id") REFERENCES "employees"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollment_id_organization_id_fkey" FOREIGN KEY ("enrollment_id", "organization_id") REFERENCES "enrollments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_training_session_id_organization_id_fkey" FOREIGN KEY ("training_session_id", "organization_id") REFERENCES "training_sessions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_organization_id_fkey" FOREIGN KEY ("employee_id", "organization_id") REFERENCES "employees"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_evidence_document_id_organization_id_fkey" FOREIGN KEY ("evidence_document_id", "organization_id") REFERENCES "documents"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_training_session_id_organization_id_fkey" FOREIGN KEY ("training_session_id", "organization_id") REFERENCES "training_sessions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_evaluation_id_organization_id_fkey" FOREIGN KEY ("evaluation_id", "organization_id") REFERENCES "evaluations"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_evaluation_id_organization_id_fkey" FOREIGN KEY ("evaluation_id", "organization_id") REFERENCES "evaluations"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_enrollment_id_organization_id_fkey" FOREIGN KEY ("enrollment_id", "organization_id") REFERENCES "enrollments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_employee_id_organization_id_fkey" FOREIGN KEY ("employee_id", "organization_id") REFERENCES "employees"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_evaluation_response_id_organization_id_fkey" FOREIGN KEY ("evaluation_response_id", "organization_id") REFERENCES "evaluation_responses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_evaluation_question_id_organization_id_fkey" FOREIGN KEY ("evaluation_question_id", "organization_id") REFERENCES "evaluation_questions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_employee_id_organization_id_fkey" FOREIGN KEY ("employee_id", "organization_id") REFERENCES "employees"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_organization_id_fkey" FOREIGN KEY ("enrollment_id", "organization_id") REFERENCES "enrollments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_employee_id_organization_id_fkey" FOREIGN KEY ("employee_id", "organization_id") REFERENCES "employees"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_organization_id_fkey" FOREIGN KEY ("course_id", "organization_id") REFERENCES "courses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_training_session_id_organization_id_fkey" FOREIGN KEY ("training_session_id", "organization_id") REFERENCES "training_sessions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_document_id_organization_id_fkey" FOREIGN KEY ("document_id", "organization_id") REFERENCES "documents"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sence_declarations" ADD CONSTRAINT "sence_declarations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sence_declarations" ADD CONSTRAINT "sence_declarations_training_session_id_organization_id_fkey" FOREIGN KEY ("training_session_id", "organization_id") REFERENCES "training_sessions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sence_documents" ADD CONSTRAINT "sence_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sence_documents" ADD CONSTRAINT "sence_documents_sence_declaration_id_organization_id_fkey" FOREIGN KEY ("sence_declaration_id", "organization_id") REFERENCES "sence_declarations"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sence_documents" ADD CONSTRAINT "sence_documents_document_id_organization_id_fkey" FOREIGN KEY ("document_id", "organization_id") REFERENCES "documents"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_organization_id_fkey" FOREIGN KEY ("uploaded_by_user_id", "organization_id") REFERENCES "users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_organization_id_fkey" FOREIGN KEY ("user_id", "organization_id") REFERENCES "users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_created_by_user_id_organization_id_fkey" FOREIGN KEY ("created_by_user_id", "organization_id") REFERENCES "users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
