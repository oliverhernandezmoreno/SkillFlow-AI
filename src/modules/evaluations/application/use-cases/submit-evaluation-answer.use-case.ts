import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../../attendance/domain/repositories/attendance.repository.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import { EvaluationAnswer } from '../../domain/entities/evaluation-answer.entity.js';
import { EvaluationResponseEntity } from '../../domain/entities/evaluation-response.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationAnswerDto, SubmitEvaluationAnswerDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';
import { scoreAnswer } from './evaluation-scoring.js';
import { loadEvaluation, validateParticipant } from './evaluation-use-case.helpers.js';

export class SubmitEvaluationAnswerUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    input: SubmitEvaluationAnswerDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationAnswerDto> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }
    if (context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const evaluation = await loadEvaluation({
      evaluationRepository: this.evaluationRepository,
      evaluationId,
      organizationId: input.organizationId,
    });
    const evaluationProps = evaluation.toPrimitives();
    await validateParticipant({
      enrollmentRepository: this.enrollmentRepository,
      attendanceRepository: this.attendanceRepository,
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
      trainingSessionId: evaluationProps.trainingSessionId,
    });
    const question = await this.evaluationRepository.findQuestionById(
      evaluationId,
      input.evaluationQuestionId,
      input.organizationId,
    );
    if (!question) {
      throw new NotFoundError('Evaluation question not found');
    }

    let response = await this.evaluationRepository.findResponseByEvaluationAndEmployee(
      evaluationId,
      input.employeeId,
      input.organizationId,
    );
    response ??= EvaluationResponseEntity.create({
      organizationId: input.organizationId,
      evaluationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
    });

    const existingAnswers = await this.evaluationRepository.findAnswersByResponse(
      response.id,
      input.organizationId,
    );
    if (
      existingAnswers.some(
        (answer) => answer.toPrimitives().evaluationQuestionId === input.evaluationQuestionId,
      )
    ) {
      throw new ConflictError('Question already has an answer for this participant');
    }

    const answer = EvaluationAnswer.create({
      organizationId: input.organizationId,
      evaluationResponseId: response.id,
      evaluationQuestionId: input.evaluationQuestionId,
      employeeId: input.employeeId,
      answer: input.answer,
      score: scoreAnswer(question, input.answer),
    });
    const responseWasCreated = response.toPrimitives().createdAt.getTime() === response.toPrimitives().updatedAt.getTime();
    const persistedResponse = await this.evaluationRepository.findResponseByEvaluationAndEmployee(
      evaluationId,
      input.employeeId,
      input.organizationId,
    );
    if (persistedResponse) {
      await this.evaluationRepository.addAnswer(answer);
      response = persistedResponse;
    } else if (responseWasCreated) {
      await this.evaluationRepository.saveResponseWithAnswer(response, answer);
    }
    const created = EvaluationMapper.toAnswerDto(answer);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.answer.submit',
      metadata: { responseId: response.id, questionId: input.evaluationQuestionId },
      after: created,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return created;
  }
}
