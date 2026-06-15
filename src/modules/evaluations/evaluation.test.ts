import { describe, expect, it } from 'vitest';

import { NoopAuditLogger } from '../../shared/application/audit-logger.js';
import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { BadRequestError, ForbiddenError } from '../../shared/domain/errors.js';
import { AttendanceRecord } from '../attendance/domain/entities/attendance-record.entity.js';
import type {
  AttendanceRepository,
  AttendanceSearchFilters,
} from '../attendance/domain/repositories/attendance.repository.js';
import { Enrollment } from '../enrollments/domain/entities/enrollment.entity.js';
import type {
  CreateEnrollmentCapacityInput,
  EnrollmentRepository,
  EnrollmentSearchFilters,
} from '../enrollments/domain/repositories/enrollment.repository.js';
import { TrainingSession } from '../training-sessions/domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from '../training-sessions/domain/repositories/training-session.repository.js';
import { AddEvaluationQuestionUseCase } from './application/use-cases/add-evaluation-question.use-case.js';
import { CalculateEvaluationResultUseCase } from './application/use-cases/calculate-evaluation-result.use-case.js';
import { CloseEvaluationUseCase } from './application/use-cases/close-evaluation.use-case.js';
import { CreateEvaluationUseCase } from './application/use-cases/create-evaluation.use-case.js';
import { GetEvaluationUseCase } from './application/use-cases/get-evaluation.use-case.js';
import { ListEmployeeEvaluationsUseCase } from './application/use-cases/list-employee-evaluations.use-case.js';
import { ListEnrollmentEvaluationsUseCase } from './application/use-cases/list-enrollment-evaluations.use-case.js';
import { ListSessionEvaluationsUseCase } from './application/use-cases/list-session-evaluations.use-case.js';
import { SubmitEvaluationAnswerUseCase } from './application/use-cases/submit-evaluation-answer.use-case.js';
import { SubmitEvaluationUseCase } from './application/use-cases/submit-evaluation.use-case.js';
import { EvaluationController } from './interfaces/http/controllers/evaluation.controller.js';
import { Evaluation } from './domain/entities/evaluation.entity.js';
import { EvaluationAnswer } from './domain/entities/evaluation-answer.entity.js';
import { EvaluationQuestion } from './domain/entities/evaluation-question.entity.js';
import { EvaluationResponseEntity } from './domain/entities/evaluation-response.entity.js';
import type {
  EvaluationRepository,
  EvaluationSearchFilters,
} from './domain/repositories/evaluation.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const trainingSessionId = '33333333-3333-4333-8333-333333333333';
const courseId = '44444444-4444-4444-8444-444444444444';
const enrollmentId = '55555555-5555-4555-8555-555555555555';
const employeeId = '66666666-6666-4666-8666-666666666666';

class FakeEvaluationRepository implements EvaluationRepository {
  evaluations: Evaluation[] = [];
  questions: EvaluationQuestion[] = [];
  responses: EvaluationResponseEntity[] = [];
  answers: EvaluationAnswer[] = [];

  async findById(id: string, inputOrganizationId: string): Promise<Evaluation | null> {
    return (
      this.evaluations.find((evaluation) => {
        const props = evaluation.toPrimitives();
        return evaluation.id === id && props.organizationId === inputOrganizationId && !props.deletedAt;
      }) ?? null
    );
  }

  async search(
    filters: EvaluationSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<Evaluation>> {
    const data = this.evaluations.filter((evaluation) => {
      const props = evaluation.toPrimitives();
      const matchingResponse = this.responses.some((response) => {
        const responseProps = response.toPrimitives();
        return (
          responseProps.evaluationId === props.id &&
          responseProps.organizationId === filters.organizationId &&
          (filters.employeeId === undefined || responseProps.employeeId === filters.employeeId) &&
          (filters.enrollmentId === undefined || responseProps.enrollmentId === filters.enrollmentId)
        );
      });
      return (
        props.organizationId === filters.organizationId &&
        !props.deletedAt &&
        (filters.trainingSessionId === undefined ||
          props.trainingSessionId === filters.trainingSessionId) &&
        (filters.type === undefined || props.type === filters.type) &&
        (filters.employeeId === undefined && filters.enrollmentId === undefined
          ? true
          : matchingResponse)
      );
    });
    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async save(evaluation: Evaluation): Promise<void> {
    this.evaluations.push(evaluation);
  }

  async update(evaluation: Evaluation): Promise<void> {
    this.evaluations = this.evaluations.map((current) =>
      current.id === evaluation.id ? evaluation : current,
    );
  }

  async addQuestion(question: EvaluationQuestion): Promise<void> {
    this.questions.push(question);
  }

  async updateQuestion(question: EvaluationQuestion): Promise<void> {
    this.questions = this.questions.map((current) => (current.id === question.id ? question : current));
  }

  async findQuestionById(
    inputEvaluationId: string,
    questionId: string,
    inputOrganizationId: string,
  ): Promise<EvaluationQuestion | null> {
    return (
      this.questions.find((question) => {
        const props = question.toPrimitives();
        return (
          question.id === questionId &&
          props.evaluationId === inputEvaluationId &&
          props.organizationId === inputOrganizationId
        );
      }) ?? null
    );
  }

  async findQuestions(inputEvaluationId: string, inputOrganizationId: string): Promise<EvaluationQuestion[]> {
    return this.questions.filter((question) => {
      const props = question.toPrimitives();
      return props.evaluationId === inputEvaluationId && props.organizationId === inputOrganizationId;
    });
  }

  async findResponseByEvaluationAndEmployee(
    inputEvaluationId: string,
    inputEmployeeId: string,
    inputOrganizationId: string,
  ): Promise<EvaluationResponseEntity | null> {
    return (
      this.responses.find((response) => {
        const props = response.toPrimitives();
        return (
          props.evaluationId === inputEvaluationId &&
          props.employeeId === inputEmployeeId &&
          props.organizationId === inputOrganizationId
        );
      }) ?? null
    );
  }

  async saveResponseWithAnswers(
    response: EvaluationResponseEntity,
    answers: EvaluationAnswer[],
  ): Promise<void> {
    this.responses.push(response);
    this.answers.push(...answers);
  }

  async saveResponseWithAnswer(
    response: EvaluationResponseEntity,
    answer: EvaluationAnswer,
  ): Promise<void> {
    this.responses.push(response);
    this.answers.push(answer);
  }

  async updateResponse(response: EvaluationResponseEntity): Promise<void> {
    this.responses = this.responses.map((current) => (current.id === response.id ? response : current));
  }

  async addAnswer(answer: EvaluationAnswer): Promise<void> {
    this.answers.push(answer);
  }

  async findAnswersByResponse(
    evaluationResponseId: string,
    inputOrganizationId: string,
  ): Promise<EvaluationAnswer[]> {
    return this.answers.filter((answer) => {
      const props = answer.toPrimitives();
      return props.evaluationResponseId === evaluationResponseId && props.organizationId === inputOrganizationId;
    });
  }
}

class FakeEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly enrollments: Enrollment[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<Enrollment | null> {
    return (
      this.enrollments.find((enrollment) => {
        const props = enrollment.toPrimitives();
        return enrollment.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findBySessionAndEmployee(): Promise<Enrollment | null> {
    return null;
  }

  async search(
    _filters: EnrollmentSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<Enrollment>> {
    return {
      data: this.enrollments,
      meta: { page: 1, pageSize: 20, total: this.enrollments.length, totalPages: 1 },
    };
  }

  async createWithCapacity(_input: CreateEnrollmentCapacityInput): Promise<Enrollment> {
    throw new Error('Not implemented');
  }

  async countOccupiedSeats(): Promise<number> {
    return 0;
  }

  async findOldestWaitlisted(): Promise<Enrollment | null> {
    return null;
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

class FakeAttendanceRepository implements AttendanceRepository {
  constructor(private readonly attendanceRecords: AttendanceRecord[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<AttendanceRecord | null> {
    return (
      this.attendanceRecords.find((attendanceRecord) => {
        const props = attendanceRecord.toPrimitives();
        return attendanceRecord.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async findByEnrollment(
    inputOrganizationId: string,
    inputEnrollmentId: string,
  ): Promise<AttendanceRecord | null> {
    return (
      this.attendanceRecords.find((attendanceRecord) => {
        const props = attendanceRecord.toPrimitives();
        return props.organizationId === inputOrganizationId && props.enrollmentId === inputEnrollmentId;
      }) ?? null
    );
  }

  async search(
    _filters: AttendanceSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<AttendanceRecord>> {
    return {
      data: this.attendanceRecords,
      meta: { page: 1, pageSize: 20, total: this.attendanceRecords.length, totalPages: 1 },
    };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

class FakeTrainingSessionRepository implements TrainingSessionRepository {
  constructor(private readonly trainingSessions: TrainingSession[]) {}

  async findById(id: string, inputOrganizationId: string): Promise<TrainingSession | null> {
    return (
      this.trainingSessions.find((trainingSession) => {
        const props = trainingSession.toPrimitives();
        return trainingSession.id === id && props.organizationId === inputOrganizationId;
      }) ?? null
    );
  }

  async search(): Promise<PaginatedResult<TrainingSession>> {
    return {
      data: this.trainingSessions,
      meta: { page: 1, pageSize: 20, total: this.trainingSessions.length, totalPages: 1 },
    };
  }

  async save(): Promise<void> {
    return undefined;
  }

  async update(): Promise<void> {
    return undefined;
  }
}

function createTrainingSession(): TrainingSession {
  return TrainingSession.rehydrate({
    id: trainingSessionId,
    organizationId,
    courseId,
    trainingPlanItemId: null,
    providerId: null,
    instructorId: null,
    name: 'Safety July',
    startDate: new Date('2026-07-10T13:00:00.000Z'),
    endDate: new Date('2026-07-10T17:00:00.000Z'),
    location: null,
    capacity: 20,
    costAmount: null,
    meetingUrl: null,
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });
}

function createEnrollment(status: 'CONFIRMED' | 'CANCELLED' | 'FAILED' = 'CONFIRMED'): Enrollment {
  return Enrollment.rehydrate({
    id: enrollmentId,
    organizationId,
    trainingSessionId,
    employeeId,
    status,
    enrolledAt: new Date(),
    completionPercentage: null,
    finalScore: null,
    approved: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });
}

function createAttendance(): AttendanceRecord {
  return AttendanceRecord.create({
    organizationId,
    enrollmentId,
    trainingSessionId,
    employeeId,
    status: 'PRESENT',
    checkInAt: new Date('2026-07-10T13:00:00.000Z'),
  });
}

function createEvaluation(): Evaluation {
  return Evaluation.create({
    organizationId,
    trainingSessionId,
    type: 'KNOWLEDGE_TEST',
    title: 'Final test',
    passingScore: 70,
  });
}

class FailingAnswerEvaluationRepository extends FakeEvaluationRepository {
  override async saveResponseWithAnswer(
    _response: EvaluationResponseEntity,
    _answer: EvaluationAnswer,
  ): Promise<void> {
    throw new Error('Answer persistence failed');
  }
}

function createQuestion(evaluationId: string): EvaluationQuestion {
  return EvaluationQuestion.create({
    organizationId,
    evaluationId,
    type: 'SINGLE_CHOICE',
    questionText: '2 + 2?',
    correctAnswer: '4',
    points: 10,
    orderIndex: 1,
  });
}

function createSubmitUseCase(input: {
  evaluationRepository: FakeEvaluationRepository;
  enrollment?: Enrollment;
  attendanceRecords?: AttendanceRecord[];
}): SubmitEvaluationUseCase {
  return new SubmitEvaluationUseCase(
    input.evaluationRepository,
    new FakeEnrollmentRepository([input.enrollment ?? createEnrollment()]),
    new FakeAttendanceRepository(input.attendanceRecords ?? [createAttendance()]),
    new NoopAuditLogger(),
  );
}

describe('Evaluations module', () => {
  it('creates an evaluation successfully', async () => {
    const repository = new FakeEvaluationRepository();
    const result = await new CreateEvaluationUseCase(
      repository,
      new FakeTrainingSessionRepository([createTrainingSession()]),
      new NoopAuditLogger(),
    ).execute(
      { organizationId, trainingSessionId, type: 'KNOWLEDGE_TEST', title: 'Final test' },
      { organizationId, actorUserId: null },
    );

    expect(result.type).toBe('KNOWLEDGE_TEST');
  });

  it('adds a question', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    repository.evaluations.push(evaluation);

    const result = await new AddEvaluationQuestionUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      {
        type: 'SINGLE_CHOICE',
        questionText: '2 + 2?',
        correctAnswer: '4',
        points: 10,
        orderIndex: 1,
      },
      { organizationId, actorUserId: null },
    );

    expect(result.points).toBe(10);
  });

  it('submits one answer', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    const result = await new SubmitEvaluationAnswerUseCase(
      repository,
      new FakeEnrollmentRepository([createEnrollment()]),
      new FakeAttendanceRepository([createAttendance()]),
      new NoopAuditLogger(),
    ).execute(
      evaluation.id,
      { organizationId, enrollmentId, employeeId, evaluationQuestionId: question.id, answer: '4' },
      { organizationId, actorUserId: null },
    );

    expect(result.score).toBe(10);
  });

  it('submits an evaluation', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    const result = await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [{ evaluationQuestionId: question.id, answer: '4' }],
      },
      { organizationId, actorUserId: null },
    );

    expect(result.passed).toBe(true);
  });

  it('calculates score and percentage', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);
    await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [{ evaluationQuestionId: question.id, answer: '4' }],
      },
      { organizationId, actorUserId: null },
    );

    const result = await new CalculateEvaluationResultUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { employeeId },
      { organizationId, actorUserId: null },
    );

    expect(result.score).toBe(10);
    expect(result.maxScore).toBe(10);
    expect(result.percentage).toBe(100);
  });

  it('calculates percentage independently from raw score', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const firstQuestion = createQuestion(evaluation.id);
    const secondQuestion = EvaluationQuestion.create({
      organizationId,
      evaluationId: evaluation.id,
      type: 'SINGLE_CHOICE',
      questionText: '3 + 3?',
      correctAnswer: '6',
      points: 10,
      orderIndex: 2,
    });
    repository.evaluations.push(evaluation);
    repository.questions.push(firstQuestion, secondQuestion);
    await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [
          { evaluationQuestionId: firstQuestion.id, answer: '4' },
          { evaluationQuestionId: secondQuestion.id, answer: '5' },
        ],
      },
      { organizationId, actorUserId: null },
    );

    const result = await new CalculateEvaluationResultUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { employeeId },
      { organizationId, actorUserId: null },
    );

    expect(result.score).toBe(10);
    expect(result.maxScore).toBe(20);
    expect(result.percentage).toBe(50);
  });

  it('determines passed status', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);
    await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [{ evaluationQuestionId: question.id, answer: '4' }],
      },
      { organizationId, actorUserId: null },
    );

    const result = await new CalculateEvaluationResultUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { employeeId },
      { organizationId, actorUserId: null },
    );

    expect(result.passed).toBe(true);
  });

  it('rejects cancelled enrollments', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    await expect(
      createSubmitUseCase({
        evaluationRepository: repository,
        enrollment: createEnrollment('CANCELLED'),
      }).execute(
        evaluation.id,
        {
          organizationId,
          enrollmentId,
          employeeId,
          answers: [{ evaluationQuestionId: question.id, answer: '4' }],
        },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects failed enrollments as rejected equivalent', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    await expect(
      createSubmitUseCase({
        evaluationRepository: repository,
        enrollment: createEnrollment('FAILED'),
      }).execute(
        evaluation.id,
        {
          organizationId,
          enrollmentId,
          employeeId,
          answers: [{ evaluationQuestionId: question.id, answer: '4' }],
        },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('requires attendance for individual evaluations', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    await expect(
      createSubmitUseCase({ evaluationRepository: repository, attendanceRecords: [] }).execute(
        evaluation.id,
        {
          organizationId,
          enrollmentId,
          employeeId,
          answers: [{ evaluationQuestionId: question.id, answer: '4' }],
        },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects cross-tenant access', async () => {
    const repository = new FakeEvaluationRepository();

    await expect(
      new CreateEvaluationUseCase(
        repository,
        new FakeTrainingSessionRepository([createTrainingSession()]),
        new NoopAuditLogger(),
      ).execute(
        { organizationId, trainingSessionId, type: 'KNOWLEDGE_TEST', title: 'Final test' },
        { organizationId: otherOrganizationId, actorUserId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lists evaluations by training session', async () => {
    const repository = new FakeEvaluationRepository();
    repository.evaluations.push(createEvaluation());

    const result = await new ListSessionEvaluationsUseCase(repository).execute(trainingSessionId, {
      organizationId,
      actorUserId: null,
    });

    expect(result.meta.total).toBe(1);
  });

  it('lists evaluations by employee', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    repository.evaluations.push(evaluation);
    repository.responses.push(
      EvaluationResponseEntity.create({ organizationId, evaluationId: evaluation.id, enrollmentId, employeeId }),
    );

    const result = await new ListEmployeeEvaluationsUseCase(repository).execute(employeeId, {
      organizationId,
      actorUserId: null,
    });

    expect(result.meta.total).toBe(1);
  });

  it('lists evaluations by enrollment', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    repository.evaluations.push(evaluation);
    repository.responses.push(
      EvaluationResponseEntity.create({ organizationId, evaluationId: evaluation.id, enrollmentId, employeeId }),
    );

    const result = await new ListEnrollmentEvaluationsUseCase(repository).execute(enrollmentId, {
      organizationId,
      actorUserId: null,
    });

    expect(result.meta.total).toBe(1);
  });

  it('closes an evaluation', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    repository.evaluations.push(evaluation);

    const result = await new CloseEvaluationUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { organizationId, actorUserId: null },
    );

    expect(result.status).toBe('CLOSED');
  });

  it('keeps a closed evaluation available by id', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    repository.evaluations.push(evaluation);

    await new CloseEvaluationUseCase(repository, new NoopAuditLogger()).execute(evaluation.id, {
      organizationId,
      actorUserId: null,
    });
    const result = await new GetEvaluationUseCase(repository).execute(evaluation.id, {
      organizationId,
      actorUserId: null,
    });

    expect(result.status).toBe('CLOSED');
  });

  it('calculates result after evaluation is closed', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);
    await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [{ evaluationQuestionId: question.id, answer: '4' }],
      },
      { organizationId, actorUserId: null },
    );
    await new CloseEvaluationUseCase(repository, new NoopAuditLogger()).execute(evaluation.id, {
      organizationId,
      actorUserId: null,
    });

    const result = await new CalculateEvaluationResultUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { employeeId },
      { organizationId, actorUserId: null },
    );

    expect(result.percentage).toBe(100);
  });

  it('sets closedAt without changing deletedAt when closing', () => {
    const evaluation = createEvaluation();

    evaluation.close();
    const props = evaluation.toPrimitives();

    expect(props.closedAt).toBeInstanceOf(Date);
    expect(props.deletedAt).toBeNull();
  });

  it('does not leave an orphan response when single answer persistence fails', async () => {
    const repository = new FailingAnswerEvaluationRepository();
    const evaluation = createEvaluation();
    const question = createQuestion(evaluation.id);
    repository.evaluations.push(evaluation);
    repository.questions.push(question);

    await expect(
      new SubmitEvaluationAnswerUseCase(
        repository,
        new FakeEnrollmentRepository([createEnrollment()]),
        new FakeAttendanceRepository([createAttendance()]),
        new NoopAuditLogger(),
      ).execute(
        evaluation.id,
        { organizationId, enrollmentId, employeeId, evaluationQuestionId: question.id, answer: '4' },
        { organizationId, actorUserId: null },
      ),
    ).rejects.toThrow('Answer persistence failed');
    expect(repository.responses).toHaveLength(0);
  });

  it('keeps raw score and percentage consistent', async () => {
    const repository = new FakeEvaluationRepository();
    const evaluation = createEvaluation();
    const firstQuestion = createQuestion(evaluation.id);
    const secondQuestion = EvaluationQuestion.create({
      organizationId,
      evaluationId: evaluation.id,
      type: 'SINGLE_CHOICE',
      questionText: '3 + 3?',
      correctAnswer: '6',
      points: 10,
      orderIndex: 2,
    });
    repository.evaluations.push(evaluation);
    repository.questions.push(firstQuestion, secondQuestion);
    const response = await createSubmitUseCase({ evaluationRepository: repository }).execute(
      evaluation.id,
      {
        organizationId,
        enrollmentId,
        employeeId,
        answers: [
          { evaluationQuestionId: firstQuestion.id, answer: '4' },
          { evaluationQuestionId: secondQuestion.id, answer: '5' },
        ],
      },
      { organizationId, actorUserId: null },
    );
    const result = await new CalculateEvaluationResultUseCase(repository, new NoopAuditLogger()).execute(
      evaluation.id,
      { employeeId },
      { organizationId, actorUserId: null },
    );

    expect(response.score).toBe(10);
    expect(result.score).toBe(10);
    expect(result.percentage).toBe(50);
  });

  it('returns bad request when result employeeId is missing', async () => {
    const controller = new EvaluationController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    let capturedError: unknown;

    controller.result(
      { params: { evaluationId: 'evaluation-id' }, query: {} } as never,
      {} as never,
      (error?: unknown) => {
        capturedError = error;
      },
    );
    await Promise.resolve();

    expect(capturedError).toBeInstanceOf(BadRequestError);
  });
});
