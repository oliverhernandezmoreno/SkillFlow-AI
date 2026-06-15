import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type { Evaluation, EvaluationType } from '../entities/evaluation.entity.js';
import type { EvaluationAnswer } from '../entities/evaluation-answer.entity.js';
import type { EvaluationQuestion } from '../entities/evaluation-question.entity.js';
import type { EvaluationResponseEntity } from '../entities/evaluation-response.entity.js';

export interface EvaluationSearchFilters {
  organizationId: string;
  trainingSessionId?: string | undefined;
  enrollmentId?: string | undefined;
  employeeId?: string | undefined;
  type?: EvaluationType | undefined;
}

export interface EvaluationRepository {
  findById(id: string, organizationId: string): Promise<Evaluation | null>;
  search(
    filters: EvaluationSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Evaluation>>;
  save(evaluation: Evaluation): Promise<void>;
  update(evaluation: Evaluation): Promise<void>;
  addQuestion(question: EvaluationQuestion): Promise<void>;
  updateQuestion(question: EvaluationQuestion): Promise<void>;
  findQuestionById(
    evaluationId: string,
    questionId: string,
    organizationId: string,
  ): Promise<EvaluationQuestion | null>;
  findQuestions(evaluationId: string, organizationId: string): Promise<EvaluationQuestion[]>;
  findResponseByEvaluationAndEmployee(
    evaluationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<EvaluationResponseEntity | null>;
  saveResponseWithAnswers(
    response: EvaluationResponseEntity,
    answers: EvaluationAnswer[],
  ): Promise<void>;
  saveResponseWithAnswer(
    response: EvaluationResponseEntity,
    answer: EvaluationAnswer,
  ): Promise<void>;
  updateResponse(response: EvaluationResponseEntity): Promise<void>;
  addAnswer(answer: EvaluationAnswer): Promise<void>;
  findAnswersByResponse(
    evaluationResponseId: string,
    organizationId: string,
  ): Promise<EvaluationAnswer[]>;
}
