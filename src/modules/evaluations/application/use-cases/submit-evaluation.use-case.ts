import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../../attendance/domain/repositories/attendance.repository.js';
import type { EnrollmentRepository } from '../../../enrollments/domain/repositories/enrollment.repository.js';
import { EvaluationAnswer } from '../../domain/entities/evaluation-answer.entity.js';
import { EvaluationResponseEntity } from '../../domain/entities/evaluation-response.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { EvaluationResponseDto, SubmitEvaluationDto } from '../dto/evaluation.dto.js';
import { EvaluationMapper } from '../mappers/evaluation.mapper.js';
import { calculateEvaluationResult, scoreAnswer } from './evaluation-scoring.js';
import { loadEvaluation, validateParticipant } from './evaluation-use-case.helpers.js';

export class SubmitEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    evaluationId: string,
    input: SubmitEvaluationDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<EvaluationResponseDto> {
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
    const uniqueQuestionIds = new Set<string>();
    for (const answer of input.answers) {
      if (uniqueQuestionIds.has(answer.evaluationQuestionId)) {
        throw new BadRequestError('Submit payload contains duplicate answers for the same question');
      }
      uniqueQuestionIds.add(answer.evaluationQuestionId);
    }
    await validateParticipant({
      enrollmentRepository: this.enrollmentRepository,
      attendanceRepository: this.attendanceRepository,
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
      trainingSessionId: evaluationProps.trainingSessionId,
    });

    const existing = await this.evaluationRepository.findResponseByEvaluationAndEmployee(
      evaluationId,
      input.employeeId,
      input.organizationId,
    );
    if (existing) {
      throw new ConflictError('Employee already submitted this evaluation');
    }

    const questions = await this.evaluationRepository.findQuestions(evaluationId, input.organizationId);
    const answers = input.answers.map((answerInput) => {
      const question = questions.find((current) => current.id === answerInput.evaluationQuestionId);
      if (!question) {
        throw new NotFoundError('Evaluation question not found');
      }
      return { question, answerInput };
    });
    const response = EvaluationResponseEntity.create({
      organizationId: input.organizationId,
      evaluationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
      answersPayload: input.answers,
    });
    const answerEntities = answers.map(({ question, answerInput }) =>
      EvaluationAnswer.create({
        organizationId: input.organizationId,
        evaluationResponseId: response.id,
        evaluationQuestionId: answerInput.evaluationQuestionId,
        employeeId: input.employeeId,
        answer: answerInput.answer,
        score: scoreAnswer(question, answerInput.answer),
      }),
    );
    const result = calculateEvaluationResult({
      evaluation,
      employeeId: input.employeeId,
      enrollmentId: input.enrollmentId ?? null,
      questions,
      answers: answerEntities,
    });
    response.updateResult({
      score: result.score,
      passed: result.passed,
      answersPayload: input.answers,
    });

    await this.evaluationRepository.saveResponseWithAnswers(response, answerEntities);
    const submitted = EvaluationMapper.toResponseDto(response);
    await this.auditLogger.record({
      organizationId: input.organizationId,
      actorUserId: context.actorUserId,
      entityType: 'EVALUATION',
      entityId: evaluationId,
      action: 'evaluation.submit',
      metadata: { responseId: response.id, employeeId: input.employeeId },
      after: submitted,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return submitted;
  }
}
