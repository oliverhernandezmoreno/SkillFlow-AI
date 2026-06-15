import { DEFAULT_EVALUATION_PASSING_SCORE } from '../config/evaluation.config.js';
import type { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationAnswer } from '../../domain/entities/evaluation-answer.entity.js';
import type { EvaluationQuestion, JsonValue } from '../../domain/entities/evaluation-question.entity.js';
import type { EvaluationResultDto } from '../dto/evaluation.dto.js';

export interface AnswerInput {
  evaluationQuestionId: string;
  answer: JsonValue;
}

export function scoreAnswer(question: EvaluationQuestion, answer: JsonValue): number | null {
  const props = question.toPrimitives();
  if (props.correctAnswer === null || props.points === null) {
    return null;
  }

  return JSON.stringify(props.correctAnswer) === JSON.stringify(answer) ? props.points : 0;
}

export function calculateEvaluationResult(input: {
  evaluation: Evaluation;
  employeeId: string;
  enrollmentId: string | null;
  questions: EvaluationQuestion[];
  answers: EvaluationAnswer[];
}): EvaluationResultDto {
  const evaluationProps = input.evaluation.toPrimitives();
  const maxScore = input.questions.reduce(
    (total, question) => total + (question.toPrimitives().points ?? 0),
    0,
  );
  const score = input.answers.reduce((total, answer) => total + (answer.toPrimitives().score ?? 0), 0);
  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const passingScore = evaluationProps.passingScore ?? DEFAULT_EVALUATION_PASSING_SCORE;

  return {
    evaluationId: evaluationProps.id,
    organizationId: evaluationProps.organizationId,
    enrollmentId: input.enrollmentId,
    employeeId: input.employeeId,
    score,
    maxScore,
    percentage,
    passed: percentage >= passingScore,
    passingScore,
  };
}
