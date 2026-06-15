import type { EvaluationStatus, EvaluationType } from '../../domain/entities/evaluation.entity.js';
import type {
  EvaluationQuestionType,
  JsonValue,
} from '../../domain/entities/evaluation-question.entity.js';

export interface EvaluationDto {
  id: string;
  organizationId: string;
  trainingSessionId: string;
  type: EvaluationType;
  title: string;
  description: string | null;
  passingScore: number | null;
  status: EvaluationStatus;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationQuestionDto {
  id: string;
  organizationId: string;
  evaluationId: string;
  type: EvaluationQuestionType;
  questionText: string;
  options: JsonValue | null;
  correctAnswer: JsonValue | null;
  points: number | null;
  orderIndex: number;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationAnswerDto {
  id: string;
  organizationId: string;
  evaluationResponseId: string;
  evaluationQuestionId: string;
  employeeId: string;
  answer: JsonValue;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResponseDto {
  id: string;
  organizationId: string;
  evaluationId: string;
  enrollmentId: string | null;
  employeeId: string;
  score: number | null;
  passed: boolean | null;
  answersPayload: JsonValue | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationDto {
  organizationId: string;
  trainingSessionId: string;
  type: EvaluationType;
  title: string;
  description?: string | null | undefined;
  passingScore?: number | null | undefined;
}

export interface UpdateEvaluationDto {
  type?: EvaluationType | undefined;
  title?: string | undefined;
  description?: string | null | undefined;
  passingScore?: number | null | undefined;
}

export interface CreateEvaluationQuestionDto {
  type: EvaluationQuestionType;
  questionText: string;
  options?: JsonValue | null | undefined;
  correctAnswer?: JsonValue | null | undefined;
  points?: number | null | undefined;
  orderIndex: number;
  required?: boolean | undefined;
}

export interface UpdateEvaluationQuestionDto {
  type?: EvaluationQuestionType | undefined;
  questionText?: string | undefined;
  options?: JsonValue | null | undefined;
  correctAnswer?: JsonValue | null | undefined;
  points?: number | null | undefined;
  orderIndex?: number | undefined;
  required?: boolean | undefined;
}

export interface SubmitEvaluationAnswerDto {
  organizationId: string;
  enrollmentId?: string | null | undefined;
  employeeId: string;
  evaluationQuestionId: string;
  answer: JsonValue;
}

export interface SubmitEvaluationDto {
  organizationId: string;
  enrollmentId?: string | null | undefined;
  employeeId: string;
  answers: {
    evaluationQuestionId: string;
    answer: JsonValue;
  }[];
}

export interface EvaluationResultDto {
  evaluationId: string;
  organizationId: string;
  enrollmentId: string | null;
  employeeId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
}
