import type {
  EvaluationAnswerDto,
  EvaluationDto,
  EvaluationQuestionDto,
  EvaluationResponseDto,
} from '../dto/evaluation.dto.js';
import type { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationAnswer } from '../../domain/entities/evaluation-answer.entity.js';
import type { EvaluationQuestion } from '../../domain/entities/evaluation-question.entity.js';
import type { EvaluationResponseEntity } from '../../domain/entities/evaluation-response.entity.js';

export class EvaluationMapper {
  static toDto(evaluation: Evaluation): EvaluationDto {
    const props = evaluation.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      trainingSessionId: props.trainingSessionId,
      type: props.type,
      title: props.title,
      description: props.description,
      passingScore: props.passingScore,
      status: props.closedAt ? 'CLOSED' : 'OPEN',
      closedAt: props.closedAt?.toISOString() ?? null,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toQuestionDto(question: EvaluationQuestion): EvaluationQuestionDto {
    const props = question.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      evaluationId: props.evaluationId,
      type: props.type,
      questionText: props.questionText,
      options: props.options,
      correctAnswer: props.correctAnswer,
      points: props.points,
      orderIndex: props.orderIndex,
      required: props.required,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toResponseDto(response: EvaluationResponseEntity): EvaluationResponseDto {
    const props = response.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      evaluationId: props.evaluationId,
      enrollmentId: props.enrollmentId,
      employeeId: props.employeeId,
      score: props.score,
      passed: props.passed,
      answersPayload: props.answersPayload,
      submittedAt: props.submittedAt.toISOString(),
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toAnswerDto(answer: EvaluationAnswer): EvaluationAnswerDto {
    const props = answer.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      evaluationResponseId: props.evaluationResponseId,
      evaluationQuestionId: props.evaluationQuestionId,
      employeeId: props.employeeId,
      answer: props.answer,
      score: props.score,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
