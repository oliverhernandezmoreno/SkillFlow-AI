# SkillFlow AI Backend Standards

**Proyecto:** SkillFlow AI — HRTech Learning & Compliance Management Platform  
**Stack Core:** Node.js + TypeScript Strict + Express.js + Prisma + PostgreSQL  
**Documento fuente para Codex:** Sí  
**Versión:** 0.1.0  
**Contrato asociado:** `api-spec.yml`

---

## 1. Propósito del documento

Este documento define los estándares técnicos, arquitectónicos y de dominio para construir el backend de SkillFlow AI usando Codex o cualquier agente de generación de código.

Debe ser tratado como la fuente de verdad para:

- Entidades TypeScript.
- Value Objects.
- Aggregates.
- Repositories interfaces.
- Domain Events.
- Casos de uso.
- Convenciones Prisma.
- Seguridad.
- Multi-tenancy.
- Testing.
- Observabilidad.
- Estructura de carpetas.
- Reglas para generación automática de código.

El archivo `api-spec.yml` define el contrato REST. Este documento define cómo se implementa internamente ese contrato.

---

## 2. Principios técnicos obligatorios

El backend debe cumplir los siguientes principios:

1. **TypeScript Strict Mode obligatorio.**
2. **Express.js como capa HTTP.**
3. **Prisma ORM como acceso a datos.**
4. **PostgreSQL como base de datos principal.**
5. **Arquitectura Clean Architecture.**
6. **Dominio modelado con DDD táctico.**
7. **Separación estricta entre dominio, aplicación, infraestructura e interfaces.**
8. **No exponer entidades Prisma directamente en controllers.**
9. **No poner lógica de negocio en controllers.**
10. **No poner lógica de negocio en repositories.**
11. **Validar inputs mediante DTOs y schemas.**
12. **Todo recurso multi-tenant debe incluir `organizationId`.**
13. **Todo endpoint protegido debe validar JWT + RBAC.**
14. **Toda acción crítica debe generar evento de auditoría.**
15. **Toda fecha debe usar ISO 8601 en API y `Date` en dominio.**
16. **Todos los IDs deben ser UUID.**
17. **Todas las tablas core deben tener `createdAt`, `updatedAt`, `deletedAt` y `version`.**

---

## 3. Arquitectura base

```text
/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── config/
│   ├── shared/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interfaces/
│   ├── modules/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── users/
│   │   ├── employees/
│   │   ├── courses/
│   │   ├── training-plans/
│   │   ├── training-sessions/
│   │   ├── enrollments/
│   │   ├── attendance/
│   │   ├── evaluations/
│   │   ├── certificates/
│   │   ├── sence/
│   │   ├── providers/
│   │   ├── documents/
│   │   ├── reports/
│   │   ├── ai/
│   │   └── audit/
│   └── tests/
└── backend-standards.md
```

Cada módulo debe tener esta estructura:

```text
module-name/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── repositories/
│   └── services/
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── mappers/
├── infrastructure/
│   ├── prisma/
│   └── services/
└── interfaces/
    ├── http/
    │   ├── controllers/
    │   ├── routes/
    │   ├── validators/
    │   └── middlewares/
    └── presenters/
```

---

## 4. Bounded Contexts

SkillFlow AI se divide en los siguientes contextos de dominio:

| Contexto | Responsabilidad |
|---|---|
| Identity & Access | Autenticación, usuarios, roles y permisos. |
| Tenant Management | Empresas, OTEC, clientes y configuración multiempresa. |
| Workforce Management | Trabajadores, cargos, áreas y competencias. |
| Learning Catalog | Cursos, competencias, contenidos y modalidad. |
| Training Planning | Plan anual de capacitación PAC y presupuesto. |
| Training Execution | Sesiones, agenda, asistencia e inscripciones. |
| Assessment & Certification | Evaluaciones, encuestas, resultados y certificados. |
| SENCE Compliance | Declaraciones, evidencias y trazabilidad SENCE. |
| Provider Management | OTEC externas, relatores y proveedores. |
| Document Management | Evidencias, documentos y archivos. |
| Reporting & Analytics | KPIs, cumplimiento, costos y reportes ejecutivos. |
| AI Copilot | Recomendaciones, brechas y automatización inteligente. |
| Audit Trail | Auditoría transversal del sistema. |

---

## 5. Convenciones generales de dominio

### 5.1 Entity

Una entidad posee identidad propia y ciclo de vida.

```typescript
export abstract class Entity<TId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }
}
```

### 5.2 Aggregate Root

Un aggregate root protege invariantes y controla modificaciones internas.

```typescript
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

### 5.3 Value Object

Un Value Object no tiene identidad propia y se compara por valor.

```typescript
export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = Object.freeze(props);
  }
}
```

### 5.4 Repository

Los repositories exponen operaciones de persistencia desde el lenguaje del dominio.

```typescript
export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  update(entity: TEntity): Promise<void>;
}
```

---

## 6. Entidades principales

### 6.1 Organization

Representa una empresa cliente, OTEC, holding o entidad usuaria del sistema.

**Tabla:** `organizations`  
**Aggregate Root:** Sí  
**Multi-tenant root:** Sí

```typescript
export class Organization extends AggregateRoot<OrganizationId> {
  private constructor(
    id: OrganizationId,
    private legalName: string,
    private tradeName: string | null,
    private taxId: Rut,
    private email: Email,
    private type: OrganizationType,
    private status: OrganizationStatus,
    private createdAt: Date,
    private updatedAt: Date,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `taxId` debe ser único a nivel sistema.
- Una organización inactiva no puede crear nuevos planes de capacitación.
- Una organización puede actuar como cliente, OTEC, proveedor o holding según `type`.
- Todo recurso operativo debe pertenecer a una organización.

---

### 6.2 User

Representa una cuenta con acceso al sistema.

**Tabla:** `users`  
**Aggregate Root:** Sí

```typescript
export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    private organizationId: OrganizationId,
    private firstName: string,
    private lastName: string,
    private email: Email,
    private passwordHash: string,
    private roles: Role[],
    private status: UserStatus,
    private lastLoginAt: Date | null,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- El email debe ser único dentro de la organización.
- Un usuario suspendido no puede iniciar sesión.
- Un usuario debe tener al menos un rol activo.
- El password nunca debe exponerse por API.

---

### 6.3 Role

Representa un perfil de permisos.

**Tabla:** `roles`  
**Aggregate Root:** No

```typescript
export class Role extends Entity<RoleId> {
  constructor(
    id: RoleId,
    private name: string,
    private permissions: Permission[],
  ) {
    super(id);
  }
}
```

**Roles iniciales:**

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `HR_MANAGER`
- `TRAINING_MANAGER`
- `INSTRUCTOR`
- `EMPLOYEE`
- `AUDITOR`
- `SENCE_MANAGER`

---

### 6.4 Employee

Representa un trabajador asociado a una organización.

**Tabla:** `employees`  
**Aggregate Root:** Sí

```typescript
export class Employee extends AggregateRoot<EmployeeId> {
  private constructor(
    id: EmployeeId,
    private organizationId: OrganizationId,
    private rut: Rut,
    private firstName: string,
    private lastName: string,
    private email: Email | null,
    private position: string,
    private department: string,
    private status: EmployeeStatus,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `rut` debe ser único dentro de la organización.
- Un trabajador inactivo no puede ser inscrito en nuevas sesiones.
- Un trabajador puede tener múltiples inscripciones.
- Un trabajador puede tener brechas de capacitación.

---

### 6.5 Course

Representa un curso del catálogo.

**Tabla:** `courses`  
**Aggregate Root:** Sí

```typescript
export class Course extends AggregateRoot<CourseId> {
  private constructor(
    id: CourseId,
    private organizationId: OrganizationId,
    private code: CourseCode,
    private name: string,
    private description: string,
    private modality: CourseModality,
    private durationHours: number,
    private status: CourseStatus,
    private competencies: string[],
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `durationHours` debe ser mayor a cero.
- Un curso archivado no puede tener nuevas sesiones.
- Un curso debe tener código único por organización.
- Un curso puede estar asociado a competencias.

---

### 6.6 TrainingPlan

Representa el Plan Anual de Capacitación PAC.

**Tabla:** `training_plans`  
**Aggregate Root:** Sí

```typescript
export class TrainingPlan extends AggregateRoot<TrainingPlanId> {
  private constructor(
    id: TrainingPlanId,
    private organizationId: OrganizationId,
    private year: number,
    private name: string,
    private budgetAmount: Money,
    private status: TrainingPlanStatus,
    private items: TrainingPlanItem[],
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- Solo puede existir un PAC activo por organización y año.
- No se puede aprobar un PAC sin cursos asociados.
- No se puede exceder el presupuesto aprobado sin autorización.
- El PAC aprobado genera evento `TrainingPlanApprovedEvent`.

---

### 6.7 TrainingPlanItem

Representa un curso planificado dentro del PAC.

**Tabla:** `training_plan_items`  
**Aggregate:** TrainingPlan

```typescript
export class TrainingPlanItem extends Entity<TrainingPlanItemId> {
  constructor(
    id: TrainingPlanItemId,
    private trainingPlanId: TrainingPlanId,
    private courseId: CourseId,
    private estimatedParticipants: number,
    private estimatedCost: Money,
    private quarter: number,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `estimatedParticipants` debe ser mayor a cero.
- `quarter` debe estar entre 1 y 4.
- El costo estimado debe sumar al presupuesto del PAC.

---

### 6.8 TrainingSession

Representa una ejecución concreta de un curso.

**Tabla:** `training_sessions`  
**Aggregate Root:** Sí

```typescript
export class TrainingSession extends AggregateRoot<TrainingSessionId> {
  private constructor(
    id: TrainingSessionId,
    private organizationId: OrganizationId,
    private courseId: CourseId,
    private instructorId: UserId | null,
    private providerId: ProviderId | null,
    private startDate: Date,
    private endDate: Date,
    private capacity: number,
    private status: TrainingSessionStatus,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `endDate` debe ser posterior a `startDate`.
- La capacidad debe ser mayor a cero.
- No se puede cerrar una sesión sin asistencia registrada.
- No se puede inscribir más participantes que la capacidad.

---

### 6.9 Enrollment

Representa la inscripción de un trabajador en una sesión.

**Tabla:** `enrollments`  
**Aggregate Root:** Sí

```typescript
export class Enrollment extends AggregateRoot<EnrollmentId> {
  private constructor(
    id: EnrollmentId,
    private organizationId: OrganizationId,
    private trainingSessionId: TrainingSessionId,
    private employeeId: EmployeeId,
    private status: EnrollmentStatus,
    private enrolledAt: Date,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- Un empleado no puede estar duplicado en la misma sesión.
- Una sesión cerrada no permite nuevas inscripciones.
- Una inscripción cancelada no permite registrar asistencia.
- La creación genera `EnrollmentCreatedEvent`.

---

### 6.10 AttendanceRecord

Representa un registro de asistencia.

**Tabla:** `attendance_records`  
**Aggregate Root:** Sí

```typescript
export class AttendanceRecord extends AggregateRoot<AttendanceRecordId> {
  private constructor(
    id: AttendanceRecordId,
    private organizationId: OrganizationId,
    private enrollmentId: EnrollmentId,
    private checkInAt: Date | null,
    private checkOutAt: Date | null,
    private method: AttendanceMethod,
    private evidenceDocumentId: DocumentId | null,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `checkOutAt` no puede ser anterior a `checkInAt`.
- La asistencia puede registrarse por QR, firma digital, carga manual o biometría futura.
- La asistencia puede requerir evidencia documental.
- El registro genera `AttendanceRegisteredEvent`.

---

### 6.11 Evaluation

Representa una evaluación o encuesta asociada a una sesión.

**Tabla:** `evaluations`  
**Aggregate Root:** Sí

```typescript
export class Evaluation extends AggregateRoot<EvaluationId> {
  private constructor(
    id: EvaluationId,
    private organizationId: OrganizationId,
    private trainingSessionId: TrainingSessionId,
    private type: EvaluationType,
    private title: string,
    private passingScore: number | null,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `passingScore` debe estar entre 0 y 100 cuando aplique.
- Una evaluación no puede responderse después del cierre de sesión si no existe autorización.
- Una evaluación aprobada puede habilitar emisión de certificado.

---

### 6.12 EvaluationResponse

Representa la respuesta de un trabajador a una evaluación.

**Tabla:** `evaluation_responses`

```typescript
export class EvaluationResponse extends AggregateRoot<EvaluationResponseId> {
  private constructor(
    id: EvaluationResponseId,
    private organizationId: OrganizationId,
    private evaluationId: EvaluationId,
    private employeeId: EmployeeId,
    private score: number | null,
    private answers: Record<string, unknown>,
    private submittedAt: Date,
  ) {
    super(id);
  }
}
```

---

### 6.13 Certificate

Representa un certificado emitido por aprobación o participación.

**Tabla:** `certificates`  
**Aggregate Root:** Sí

```typescript
export class Certificate extends AggregateRoot<CertificateId> {
  private constructor(
    id: CertificateId,
    private organizationId: OrganizationId,
    private employeeId: EmployeeId,
    private trainingSessionId: TrainingSessionId,
    private certificateNumber: string,
    private verificationCode: string,
    private issuedAt: Date,
    private documentId: DocumentId | null,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- `certificateNumber` debe ser único.
- `verificationCode` debe permitir validación pública.
- No se puede emitir certificado si el trabajador no cumple requisitos mínimos.
- La emisión genera `CertificateIssuedEvent`.

---

### 6.14 SenceDeclaration

Representa una declaración o proceso asociado a SENCE.

**Tabla:** `sence_declarations`  
**Aggregate Root:** Sí

```typescript
export class SenceDeclaration extends AggregateRoot<SenceDeclarationId> {
  private constructor(
    id: SenceDeclarationId,
    private organizationId: OrganizationId,
    private trainingSessionId: TrainingSessionId,
    private status: SenceDeclarationStatus,
    private externalCode: string | null,
    private submittedAt: Date | null,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- Una declaración debe estar asociada a una sesión válida.
- Solo sesiones cerradas pueden declararse.
- Debe existir evidencia documental antes de enviar.
- El envío genera `SenceDeclarationSubmittedEvent`.

---

### 6.15 Provider

Representa una OTEC externa, relator externo o proveedor.

**Tabla:** `providers`  
**Aggregate Root:** Sí

```typescript
export class Provider extends AggregateRoot<ProviderId> {
  private constructor(
    id: ProviderId,
    private organizationId: OrganizationId,
    private type: ProviderType,
    private legalName: string,
    private taxId: Rut | null,
    private email: Email | null,
    private phone: PhoneNumber | null,
    private status: ProviderStatus,
  ) {
    super(id);
  }
}
```

---

### 6.16 Document

Representa un archivo, evidencia o documento operativo.

**Tabla:** `documents`  
**Aggregate Root:** Sí

```typescript
export class Document extends AggregateRoot<DocumentId> {
  private constructor(
    id: DocumentId,
    private organizationId: OrganizationId,
    private type: DocumentType,
    private fileName: string,
    private mimeType: string,
    private storageKey: string,
    private sizeBytes: number,
    private uploadedByUserId: UserId,
  ) {
    super(id);
  }
}
```

**Reglas de negocio:**

- No guardar binarios en PostgreSQL.
- Guardar solo metadata y `storageKey`.
- Validar `mimeType` permitido.
- Asociar documentos a sesiones, asistencia, SENCE o certificados cuando aplique.

---

### 6.17 AuditEvent

Representa un evento de auditoría del sistema.

**Tabla:** `audit_events`  
**Aggregate Root:** No

```typescript
export class AuditEvent extends Entity<AuditEventId> {
  constructor(
    id: AuditEventId,
    private organizationId: OrganizationId | null,
    private actorUserId: UserId | null,
    private action: string,
    private resourceType: string,
    private resourceId: string | null,
    private metadata: Record<string, unknown>,
    private occurredAt: Date,
  ) {
    super(id);
  }
}
```

---

## 7. Value Objects obligatorios

### 7.1 Rut

```typescript
export class Rut extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): Rut {
    const normalized = raw.replace(/\./g, '').replace('-', '').toUpperCase();
    if (!Rut.isValid(normalized)) {
      throw new Error('Invalid RUT');
    }
    return new Rut(normalized);
  }

  static isValid(value: string): boolean {
    return /^[0-9]+[0-9K]$/.test(value);
  }

  get value(): string {
    return this.props.value;
  }
}
```

### 7.2 Email

```typescript
export class Email extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Invalid email');
    }
    return new Email(value);
  }

  get value(): string {
    return this.props.value;
  }
}
```

### 7.3 Money

```typescript
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(amount: number, currency: string) {
    super({ amount, currency });
  }

  static create(amount: number, currency = 'CLP'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    return new Money(amount, currency);
  }
}
```

### 7.4 CourseCode

```typescript
export class CourseCode extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): CourseCode {
    if (!/^CUR-[0-9]{4}-[0-9]{4}$/.test(value)) {
      throw new Error('Invalid course code format');
    }
    return new CourseCode(value);
  }
}
```

### 7.5 PhoneNumber

```typescript
export class PhoneNumber extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): PhoneNumber {
    if (!/^\+?[0-9]{8,15}$/.test(value)) {
      throw new Error('Invalid phone number');
    }
    return new PhoneNumber(value);
  }
}
```

---

## 8. Domain Events

Todos los eventos deben implementar esta interfaz:

```typescript
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly organizationId?: string;
  readonly payload: Record<string, unknown>;
}
```

Eventos iniciales:

```text
OrganizationCreatedEvent
UserCreatedEvent
EmployeeCreatedEvent
CourseCreatedEvent
TrainingPlanCreatedEvent
TrainingPlanApprovedEvent
TrainingSessionScheduledEvent
EnrollmentCreatedEvent
EnrollmentCancelledEvent
AttendanceRegisteredEvent
EvaluationCreatedEvent
EvaluationCompletedEvent
CertificateIssuedEvent
SenceDeclarationCreatedEvent
SenceDeclarationSubmittedEvent
DocumentUploadedEvent
AuditEventRecordedEvent
TrainingGapDetectedEvent
```

Ejemplo:

```typescript
export class EnrollmentCreatedEvent implements DomainEvent {
  readonly eventId = crypto.randomUUID();
  readonly occurredAt = new Date();
  readonly eventName = 'EnrollmentCreatedEvent';

  constructor(
    readonly aggregateId: string,
    readonly organizationId: string,
    readonly payload: {
      employeeId: string;
      trainingSessionId: string;
    },
  ) {}
}
```

---

## 9. Repository interfaces

### 9.1 OrganizationRepository

```typescript
export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<Organization | null>;
  findByTaxId(taxId: Rut): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
  update(organization: Organization): Promise<void>;
}
```

### 9.2 UserRepository

```typescript
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(organizationId: OrganizationId, email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
```

### 9.3 EmployeeRepository

```typescript
export interface EmployeeRepository {
  findById(id: EmployeeId): Promise<Employee | null>;
  findByRut(organizationId: OrganizationId, rut: Rut): Promise<Employee | null>;
  search(organizationId: OrganizationId, filters: EmployeeSearchFilters): Promise<Employee[]>;
  save(employee: Employee): Promise<void>;
  update(employee: Employee): Promise<void>;
}
```

### 9.4 CourseRepository

```typescript
export interface CourseRepository {
  findById(id: CourseId): Promise<Course | null>;
  findByCode(organizationId: OrganizationId, code: CourseCode): Promise<Course | null>;
  search(organizationId: OrganizationId, filters: CourseSearchFilters): Promise<Course[]>;
  save(course: Course): Promise<void>;
  update(course: Course): Promise<void>;
}
```

### 9.5 TrainingPlanRepository

```typescript
export interface TrainingPlanRepository {
  findById(id: TrainingPlanId): Promise<TrainingPlan | null>;
  findActiveByYear(organizationId: OrganizationId, year: number): Promise<TrainingPlan | null>;
  save(trainingPlan: TrainingPlan): Promise<void>;
  update(trainingPlan: TrainingPlan): Promise<void>;
}
```

### 9.6 TrainingSessionRepository

```typescript
export interface TrainingSessionRepository {
  findById(id: TrainingSessionId): Promise<TrainingSession | null>;
  search(organizationId: OrganizationId, filters: TrainingSessionSearchFilters): Promise<TrainingSession[]>;
  countEnrollments(id: TrainingSessionId): Promise<number>;
  save(session: TrainingSession): Promise<void>;
  update(session: TrainingSession): Promise<void>;
}
```

### 9.7 EnrollmentRepository

```typescript
export interface EnrollmentRepository {
  findById(id: EnrollmentId): Promise<Enrollment | null>;
  findByEmployeeAndSession(employeeId: EmployeeId, sessionId: TrainingSessionId): Promise<Enrollment | null>;
  search(organizationId: OrganizationId, filters: EnrollmentSearchFilters): Promise<Enrollment[]>;
  save(enrollment: Enrollment): Promise<void>;
  update(enrollment: Enrollment): Promise<void>;
}
```

### 9.8 AttendanceRepository

```typescript
export interface AttendanceRepository {
  findByEnrollmentId(enrollmentId: EnrollmentId): Promise<AttendanceRecord[]>;
  save(attendance: AttendanceRecord): Promise<void>;
  update(attendance: AttendanceRecord): Promise<void>;
}
```

### 9.9 CertificateRepository

```typescript
export interface CertificateRepository {
  findById(id: CertificateId): Promise<Certificate | null>;
  findByVerificationCode(code: string): Promise<Certificate | null>;
  save(certificate: Certificate): Promise<void>;
}
```

---

## 10. Casos de uso principales

Cada caso de uso debe tener una clase independiente dentro de `application/use-cases`.

```text
Auth
- RegisterOrganizationUseCase
- LoginUseCase
- RefreshTokenUseCase
- RequestPasswordResetUseCase
- ResetPasswordUseCase

Organizations
- CreateOrganizationUseCase
- UpdateOrganizationUseCase
- DeactivateOrganizationUseCase
- GetOrganizationUseCase
- ListOrganizationsUseCase

Users
- CreateUserUseCase
- AssignRoleUseCase
- SuspendUserUseCase
- ActivateUserUseCase

Employees
- CreateEmployeeUseCase
- UpdateEmployeeUseCase
- ImportEmployeesUseCase
- DeactivateEmployeeUseCase
- SearchEmployeesUseCase

Courses
- CreateCourseUseCase
- UpdateCourseUseCase
- ArchiveCourseUseCase
- SearchCoursesUseCase

Training Plans
- CreateTrainingPlanUseCase
- AddTrainingPlanItemUseCase
- ApproveTrainingPlanUseCase
- RejectTrainingPlanUseCase

Training Sessions
- ScheduleTrainingSessionUseCase
- UpdateTrainingSessionUseCase
- CancelTrainingSessionUseCase
- CloseTrainingSessionUseCase

Enrollments
- CreateEnrollmentUseCase
- CancelEnrollmentUseCase
- ListEnrollmentsUseCase

Attendance
- CheckInAttendanceUseCase
- CheckOutAttendanceUseCase
- UploadAttendanceEvidenceUseCase

Evaluations
- CreateEvaluationUseCase
- SubmitEvaluationResponseUseCase
- CalculateEvaluationScoreUseCase

Certificates
- IssueCertificateUseCase
- VerifyCertificateUseCase

SENCE
- CreateSenceDeclarationUseCase
- SubmitSenceDeclarationUseCase
- AttachSenceEvidenceUseCase

Reports
- GetDashboardReportUseCase
- GetTrainingComplianceReportUseCase

AI
- RecommendTrainingGapsUseCase
```

Ejemplo de caso de uso:

```typescript
export class CreateEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateEnrollmentInput): Promise<CreateEnrollmentOutput> {
    const employee = await this.employeeRepository.findById(input.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const session = await this.trainingSessionRepository.findById(input.trainingSessionId);
    if (!session) throw new NotFoundError('Training session not found');

    const existing = await this.enrollmentRepository.findByEmployeeAndSession(
      input.employeeId,
      input.trainingSessionId,
    );
    if (existing) throw new ConflictError('Employee already enrolled');

    const enrollment = Enrollment.create(input);
    await this.enrollmentRepository.save(enrollment);
    await this.eventBus.publishAll(enrollment.pullDomainEvents());

    return EnrollmentMapper.toOutput(enrollment);
  }
}
```

---

## 11. Prisma schema base

Este modelo debe ser implementado en `prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrganizationType {
  CLIENT
  OTEC
  PROVIDER
  HOLDING
}

enum OrganizationStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum EmployeeStatus {
  ACTIVE
  INACTIVE
  TERMINATED
}

enum CourseModality {
  PRESENTIAL
  ONLINE
  HYBRID
}

enum CourseStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum TrainingPlanStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  CLOSED
}

enum TrainingSessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  CLOSED
}

enum EnrollmentStatus {
  ENROLLED
  CANCELLED
  COMPLETED
  FAILED
}

enum AttendanceMethod {
  QR
  DIGITAL_SIGNATURE
  MANUAL
  BIOMETRIC
}

enum EvaluationType {
  KNOWLEDGE
  SATISFACTION
  PRACTICAL
  DIAGNOSTIC
}

enum SenceDeclarationStatus {
  DRAFT
  READY
  SUBMITTED
  ACCEPTED
  REJECTED
}

enum ProviderType {
  OTEC
  INSTRUCTOR
  CONSULTANT
  OTHER
}

enum ProviderStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

enum DocumentType {
  ATTENDANCE_EVIDENCE
  CERTIFICATE
  SENCE_EVIDENCE
  CONTRACT
  COURSE_MATERIAL
  OTHER
}

model Organization {
  id          String             @id @default(uuid()) @db.Uuid
  legalName   String             @map("legal_name")
  tradeName   String?            @map("trade_name")
  taxId       String             @unique @map("tax_id")
  email       String
  type        OrganizationType
  status      OrganizationStatus @default(ACTIVE)
  createdAt   DateTime           @default(now()) @map("created_at")
  updatedAt   DateTime           @updatedAt @map("updated_at")
  deletedAt   DateTime?          @map("deleted_at")
  version     Int                @default(1)

  users       User[]
  employees   Employee[]
  courses     Course[]
  plans       TrainingPlan[]
  sessions    TrainingSession[]
  providers   Provider[]
  documents   Document[]
  auditEvents AuditEvent[]

  @@map("organizations")
}

model User {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  firstName      String     @map("first_name")
  lastName       String     @map("last_name")
  email          String
  passwordHash   String     @map("password_hash")
  status         UserStatus @default(ACTIVE)
  lastLoginAt    DateTime?  @map("last_login_at")
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")
  deletedAt      DateTime?  @map("deleted_at")
  version        Int        @default(1)

  organization   Organization @relation(fields: [organizationId], references: [id])
  userRoles      UserRole[]
  documents      Document[]

  @@unique([organizationId, email])
  @@index([organizationId])
  @@map("users")
}

model Role {
  id          String     @id @default(uuid()) @db.Uuid
  name        String     @unique
  description String?
  permissions String[]
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  userRoles   UserRole[]

  @@map("roles")
}

model UserRole {
  userId String @map("user_id") @db.Uuid
  roleId String @map("role_id") @db.Uuid

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@map("user_roles")
}

model Employee {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  rut            String
  firstName      String         @map("first_name")
  lastName       String         @map("last_name")
  email          String?
  position       String
  department     String
  status         EmployeeStatus @default(ACTIVE)
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")
  version        Int            @default(1)

  organization   Organization   @relation(fields: [organizationId], references: [id])
  enrollments    Enrollment[]
  responses      EvaluationResponse[]
  certificates   Certificate[]

  @@unique([organizationId, rut])
  @@index([organizationId])
  @@map("employees")
}

model Course {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  code           String
  name           String
  description    String
  modality       CourseModality
  durationHours  Int            @map("duration_hours")
  status         CourseStatus   @default(DRAFT)
  competencies   String[]
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")
  version        Int            @default(1)

  organization   Organization   @relation(fields: [organizationId], references: [id])
  planItems      TrainingPlanItem[]
  sessions       TrainingSession[]

  @@unique([organizationId, code])
  @@index([organizationId])
  @@map("courses")
}

model TrainingPlan {
  id             String             @id @default(uuid()) @db.Uuid
  organizationId String             @map("organization_id") @db.Uuid
  year           Int
  name           String
  budgetAmount   Decimal            @map("budget_amount") @db.Decimal(14, 2)
  currency       String             @default("CLP")
  status         TrainingPlanStatus @default(DRAFT)
  createdAt      DateTime           @default(now()) @map("created_at")
  updatedAt      DateTime           @updatedAt @map("updated_at")
  deletedAt      DateTime?          @map("deleted_at")
  version        Int                @default(1)

  organization   Organization       @relation(fields: [organizationId], references: [id])
  items          TrainingPlanItem[]

  @@unique([organizationId, year])
  @@index([organizationId])
  @@map("training_plans")
}

model TrainingPlanItem {
  id                    String       @id @default(uuid()) @db.Uuid
  trainingPlanId         String       @map("training_plan_id") @db.Uuid
  courseId               String       @map("course_id") @db.Uuid
  estimatedParticipants  Int          @map("estimated_participants")
  estimatedCost          Decimal      @map("estimated_cost") @db.Decimal(14, 2)
  quarter                Int
  createdAt              DateTime     @default(now()) @map("created_at")
  updatedAt              DateTime     @updatedAt @map("updated_at")

  trainingPlan           TrainingPlan @relation(fields: [trainingPlanId], references: [id])
  course                 Course       @relation(fields: [courseId], references: [id])

  @@index([trainingPlanId])
  @@map("training_plan_items")
}

model TrainingSession {
  id             String                @id @default(uuid()) @db.Uuid
  organizationId String                @map("organization_id") @db.Uuid
  courseId       String                @map("course_id") @db.Uuid
  instructorId   String?               @map("instructor_id") @db.Uuid
  providerId     String?               @map("provider_id") @db.Uuid
  startDate      DateTime              @map("start_date")
  endDate        DateTime              @map("end_date")
  capacity       Int
  status         TrainingSessionStatus @default(SCHEDULED)
  createdAt      DateTime              @default(now()) @map("created_at")
  updatedAt      DateTime              @updatedAt @map("updated_at")
  deletedAt      DateTime?             @map("deleted_at")
  version        Int                   @default(1)

  organization   Organization          @relation(fields: [organizationId], references: [id])
  course         Course                 @relation(fields: [courseId], references: [id])
  provider       Provider?              @relation(fields: [providerId], references: [id])
  enrollments    Enrollment[]
  evaluations    Evaluation[]
  senceDeclarations SenceDeclaration[]
  certificates   Certificate[]

  @@index([organizationId])
  @@index([courseId])
  @@map("training_sessions")
}

model Enrollment {
  id                String           @id @default(uuid()) @db.Uuid
  organizationId    String           @map("organization_id") @db.Uuid
  trainingSessionId String           @map("training_session_id") @db.Uuid
  employeeId        String           @map("employee_id") @db.Uuid
  status            EnrollmentStatus @default(ENROLLED)
  enrolledAt        DateTime         @default(now()) @map("enrolled_at")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")
  deletedAt         DateTime?        @map("deleted_at")
  version           Int              @default(1)

  employee          Employee         @relation(fields: [employeeId], references: [id])
  trainingSession   TrainingSession  @relation(fields: [trainingSessionId], references: [id])
  attendanceRecords AttendanceRecord[]

  @@unique([trainingSessionId, employeeId])
  @@index([organizationId])
  @@map("enrollments")
}

model AttendanceRecord {
  id                 String           @id @default(uuid()) @db.Uuid
  organizationId     String           @map("organization_id") @db.Uuid
  enrollmentId       String           @map("enrollment_id") @db.Uuid
  checkInAt          DateTime?        @map("check_in_at")
  checkOutAt         DateTime?        @map("check_out_at")
  method             AttendanceMethod
  evidenceDocumentId String?          @map("evidence_document_id") @db.Uuid
  createdAt          DateTime         @default(now()) @map("created_at")
  updatedAt          DateTime         @updatedAt @map("updated_at")
  deletedAt          DateTime?        @map("deleted_at")
  version            Int              @default(1)

  enrollment         Enrollment       @relation(fields: [enrollmentId], references: [id])

  @@index([organizationId])
  @@index([enrollmentId])
  @@map("attendance_records")
}

model Evaluation {
  id                String              @id @default(uuid()) @db.Uuid
  organizationId    String              @map("organization_id") @db.Uuid
  trainingSessionId String              @map("training_session_id") @db.Uuid
  type              EvaluationType
  title             String
  passingScore      Int?                @map("passing_score")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")
  deletedAt         DateTime?           @map("deleted_at")
  version           Int                 @default(1)

  trainingSession   TrainingSession     @relation(fields: [trainingSessionId], references: [id])
  responses         EvaluationResponse[]

  @@index([organizationId])
  @@map("evaluations")
}

model EvaluationResponse {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  evaluationId   String     @map("evaluation_id") @db.Uuid
  employeeId     String     @map("employee_id") @db.Uuid
  score          Int?
  answers        Json
  submittedAt    DateTime   @default(now()) @map("submitted_at")
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  evaluation     Evaluation @relation(fields: [evaluationId], references: [id])
  employee       Employee   @relation(fields: [employeeId], references: [id])

  @@unique([evaluationId, employeeId])
  @@index([organizationId])
  @@map("evaluation_responses")
}

model Certificate {
  id                 String          @id @default(uuid()) @db.Uuid
  organizationId     String          @map("organization_id") @db.Uuid
  employeeId         String          @map("employee_id") @db.Uuid
  trainingSessionId  String          @map("training_session_id") @db.Uuid
  certificateNumber  String          @unique @map("certificate_number")
  verificationCode   String          @unique @map("verification_code")
  issuedAt           DateTime        @default(now()) @map("issued_at")
  documentId         String?         @map("document_id") @db.Uuid
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")

  employee           Employee        @relation(fields: [employeeId], references: [id])
  trainingSession    TrainingSession @relation(fields: [trainingSessionId], references: [id])

  @@index([organizationId])
  @@map("certificates")
}

model SenceDeclaration {
  id                String                  @id @default(uuid()) @db.Uuid
  organizationId    String                  @map("organization_id") @db.Uuid
  trainingSessionId String                  @map("training_session_id") @db.Uuid
  status            SenceDeclarationStatus  @default(DRAFT)
  externalCode      String?                 @map("external_code")
  submittedAt       DateTime?               @map("submitted_at")
  createdAt         DateTime                @default(now()) @map("created_at")
  updatedAt         DateTime                @updatedAt @map("updated_at")
  deletedAt         DateTime?               @map("deleted_at")
  version           Int                     @default(1)

  trainingSession   TrainingSession         @relation(fields: [trainingSessionId], references: [id])

  @@index([organizationId])
  @@map("sence_declarations")
}

model Provider {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  type           ProviderType
  legalName      String         @map("legal_name")
  taxId          String?        @map("tax_id")
  email          String?
  phone          String?
  status         ProviderStatus @default(ACTIVE)
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")
  version        Int            @default(1)

  organization   Organization   @relation(fields: [organizationId], references: [id])
  sessions       TrainingSession[]

  @@index([organizationId])
  @@map("providers")
}

model Document {
  id               String       @id @default(uuid()) @db.Uuid
  organizationId   String       @map("organization_id") @db.Uuid
  type             DocumentType
  fileName         String       @map("file_name")
  mimeType         String       @map("mime_type")
  storageKey       String       @map("storage_key")
  sizeBytes        Int          @map("size_bytes")
  uploadedByUserId String       @map("uploaded_by_user_id") @db.Uuid
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")
  version          Int          @default(1)

  organization     Organization @relation(fields: [organizationId], references: [id])
  uploadedBy       User         @relation(fields: [uploadedByUserId], references: [id])

  @@index([organizationId])
  @@map("documents")
}

model AuditEvent {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String?       @map("organization_id") @db.Uuid
  actorUserId    String?       @map("actor_user_id") @db.Uuid
  action         String
  resourceType   String        @map("resource_type")
  resourceId     String?       @map("resource_id")
  metadata       Json
  occurredAt     DateTime      @default(now()) @map("occurred_at")

  organization   Organization? @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([resourceType, resourceId])
  @@map("audit_events")
}
```

---

## 12. Multi-tenancy

SkillFlow AI debe implementar multi-tenancy por `organizationId`.

Reglas obligatorias:

- Todo recurso operativo debe incluir `organizationId`.
- Los repositories deben filtrar por `organizationId` salvo recursos globales.
- Los usuarios no pueden acceder a información de otra organización.
- `SUPER_ADMIN` puede operar sobre múltiples organizaciones.
- Los logs y auditorías deben incluir `organizationId` cuando exista.

Middleware requerido:

```typescript
export interface TenantContext {
  organizationId: string;
  userId: string;
  roles: string[];
  permissions: string[];
}
```

---

## 13. Seguridad y autenticación

### 13.1 JWT

- Access token corto: 15 minutos.
- Refresh token: 7 a 30 días.
- Password con Argon2id o bcrypt cost alto.
- Nunca retornar passwordHash.
- Rotación de refresh tokens recomendada.

### 13.2 RBAC

Permisos sugeridos:

```text
organizations:read
organizations:create
organizations:update
users:read
users:create
users:update
employees:read
employees:create
employees:update
courses:read
courses:create
courses:update
training-plans:read
training-plans:create
training-plans:approve
training-sessions:read
training-sessions:create
enrollments:create
attendance:create
evaluations:create
certificates:issue
sence:submit
reports:read
audit:read
```

Middleware ejemplo:

```typescript
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth.permissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
```

### 13.3 OWASP mínimo

- Helmet.
- CORS configurado por ambiente.
- Rate limiting en auth.
- Validación de payloads.
- Sanitización de inputs.
- Logs sin datos sensibles.
- Manejo centralizado de errores.
- Auditoría para acciones críticas.

---

## 14. Validación DTO

Se recomienda `zod` para validación de entrada.

Ejemplo:

```typescript
export const createEmployeeSchema = z.object({
  rut: z.string().min(7),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  position: z.string().min(1),
  department: z.string().min(1),
});
```

Reglas:

- Validar request antes del controller.
- Convertir DTO a comandos de aplicación.
- No usar DTOs como entidades de dominio.
- No retornar objetos Prisma directamente.

---

## 15. Manejo de errores

Errores base:

```typescript
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
}
```

Formato de error API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

---

## 16. Controllers

Los controllers deben ser delgados.

Ejemplo:

```typescript
export class EmployeeController {
  constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase) {}

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const output = await this.createEmployeeUseCase.execute({
      organizationId: req.auth.organizationId,
      ...req.body,
    });

    res.status(201).json(output);
  };
}
```

Prohibido en controllers:

- Lógica de negocio.
- Queries Prisma directas.
- Cálculos de dominio.
- Decisiones de permisos complejas.

---

## 17. Mappers

Todo módulo debe tener mappers.

```typescript
export class EmployeeMapper {
  static toDomain(record: PrismaEmployee): Employee {
    return Employee.restore({
      id: record.id,
      organizationId: record.organizationId,
      rut: record.rut,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      position: record.position,
      department: record.department,
      status: record.status,
    });
  }

  static toPersistence(entity: Employee): Prisma.EmployeeUncheckedCreateInput {
    return {
      id: entity.id.value,
      organizationId: entity.organizationId.value,
      rut: entity.rut.value,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email?.value,
      position: entity.position,
      department: entity.department,
      status: entity.status,
    };
  }
}
```

---

## 18. Auditoría

Acciones que deben auditarse:

- Login exitoso y fallido.
- Creación, actualización o suspensión de usuarios.
- Creación o modificación de trabajadores.
- Aprobación de PAC.
- Cierre de sesiones.
- Registro o modificación de asistencia.
- Emisión de certificados.
- Envío de declaración SENCE.
- Descarga de reportes sensibles.
- Cambios de configuración multi-tenant.

Formato de acción:

```text
resource.action
```

Ejemplos:

```text
user.created
employee.updated
training_plan.approved
attendance.checked_in
certificate.issued
sence_declaration.submitted
```

---

## 19. Testing

### 19.1 Unit Tests

Obligatorios para:

- Value Objects.
- Entidades.
- Aggregates.
- Use Cases.
- Domain Services.

### 19.2 Integration Tests

Obligatorios para:

- Repositories Prisma.
- Auth flow.
- Endpoints críticos.
- Multi-tenancy.
- RBAC.

### 19.3 E2E Tests

Flujos críticos:

```text
1. Crear organización -> crear usuario admin -> login.
2. Crear trabajador -> crear curso -> crear sesión -> inscribir trabajador.
3. Registrar asistencia -> crear evaluación -> emitir certificado.
4. Cerrar sesión -> crear declaración SENCE -> adjuntar evidencia -> enviar.
5. Intentar acceder a datos de otra organización -> debe fallar con 403.
```

Herramientas sugeridas:

```text
Vitest o Jest
Supertest
Testcontainers
Prisma test database
```

---

## 20. Observabilidad

El backend debe incluir:

- Request ID.
- Structured logging con `pino`.
- Health check `/health`.
- Readiness check futuro `/ready`.
- Logs de errores centralizados.
- Métricas futuras compatibles con Prometheus.

Campos mínimos de log:

```json
{
  "requestId": "uuid",
  "organizationId": "uuid",
  "userId": "uuid",
  "method": "POST",
  "path": "/api/v1/employees",
  "statusCode": 201,
  "durationMs": 42
}
```

---

## 21. Variables de entorno

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/SkillFlow AI
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
STORAGE_PROVIDER=local
STORAGE_BUCKET=SkillFlow AI-dev
LOG_LEVEL=debug
```

---

## 22. Comandos recomendados

```json
{
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "lint": "eslint src --ext .ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 23. Reglas para Codex

Cuando Codex genere código para este backend debe obedecer estas reglas:

1. Leer primero `api-spec.yml` y `backend-standards.md`.
2. No modificar el contrato API sin instrucción explícita.
3. Crear módulos siguiendo Clean Architecture.
4. No usar Prisma en controllers.
5. No retornar entidades Prisma por HTTP.
6. Crear DTOs, validators, mappers y use cases por endpoint.
7. Mantener `organizationId` en toda operación multi-tenant.
8. Aplicar RBAC por endpoint.
9. Generar tests unitarios para reglas de negocio.
10. Generar tests de integración para repositories.
11. Crear migrations Prisma cuando cambie el modelo.
12. No introducir dependencias sin justificar.
13. Mantener TypeScript strict sin `any`, salvo `Record<string, unknown>` donde aplique.
14. Usar errores tipados.
15. Registrar auditoría en acciones críticas.

Prompt recomendado para Codex:

```text
Lee api-spec.yml y backend-standards.md. Implementa el backend SkillFlow AI en Node.js, TypeScript strict, Express.js, Prisma y PostgreSQL siguiendo Clean Architecture y DDD. Genera primero la estructura de carpetas, Prisma schema, módulos base, configuración, middlewares, errores, autenticación JWT, RBAC, repositories, use cases, controllers y tests. No coloques lógica de negocio en controllers ni Prisma directo fuera de infrastructure/prisma. Respeta multi-tenancy por organizationId.
```

---

## 24. Roadmap técnico backend

### Fase 1 — Base técnica

- Estructura Node.js + TypeScript.
- Express app.
- Prisma setup.
- Configuración `.env`.
- Error handler.
- Logger.
- Health check.

### Fase 2 — Seguridad

- Auth JWT.
- Password hashing.
- RBAC.
- Middleware tenant.
- Rate limiting.

### Fase 3 — Core dominio

- Organizations.
- Users.
- Roles.
- Employees.
- Courses.

### Fase 4 — Capacitación

- Training Plans.
- Training Sessions.
- Enrollments.
- Attendance.
- Evaluations.
- Certificates.

### Fase 5 — Compliance

- SENCE.
- Documents.
- Audit.

### Fase 6 — Analytics e IA

- Reports.
- Dashboard.
- AI Copilot.
- Recomendación de brechas.

---

## 25. Definition of Done backend

Una funcionalidad se considera terminada cuando cumple:

- Endpoint existe según `api-spec.yml`.
- DTO validado.
- Use case implementado.
- Repository interface implementada.
- Prisma repository implementado.
- Mapper implementado.
- RBAC aplicado.
- Multi-tenancy aplicado.
- Auditoría registrada si corresponde.
- Tests unitarios creados.
- Tests de integración creados cuando corresponde.
- Error handling consistente.
- Sin errores TypeScript strict.
- Sin acceso directo a Prisma desde controller.

---

## 26. Resumen ejecutivo para el equipo técnico

SkillFlow AI debe construirse como una plataforma SaaS multiempresa robusta, segura y escalable para gestionar capacitación, cumplimiento, SENCE, certificados y reportería. El backend debe separar claramente dominio, aplicación, infraestructura e interfaces. Prisma es una herramienta de persistencia, no el modelo de dominio. El contrato REST vive en `api-spec.yml`; la arquitectura y reglas viven en este `backend-standards.md`.
