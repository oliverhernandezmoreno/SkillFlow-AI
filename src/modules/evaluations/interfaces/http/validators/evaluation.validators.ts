import { z } from 'zod';

export const evaluationTypeSchema = z.enum([
  'KNOWLEDGE',
  'KNOWLEDGE_TEST',
  'SATISFACTION',
  'SATISFACTION_SURVEY',
  'PRACTICAL',
  'PRACTICAL_ASSESSMENT',
  'DIAGNOSTIC',
]);

export const evaluationQuestionTypeSchema = z.enum([
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TEXT',
  'NUMERIC',
  'SCALE',
  'BOOLEAN',
]);

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const createEvaluationSchema = z.object({
  organizationId: z.string().uuid(),
  trainingSessionId: z.string().uuid(),
  type: evaluationTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  passingScore: z.number().min(0).max(100).nullable().optional(),
});

export const updateEvaluationSchema = z.object({
  type: evaluationTypeSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  passingScore: z.number().min(0).max(100).nullable().optional(),
});

export const createEvaluationQuestionSchema = z.object({
  type: evaluationQuestionTypeSchema,
  questionText: z.string().min(1).max(1000),
  options: jsonValueSchema.nullable().optional(),
  correctAnswer: jsonValueSchema.nullable().optional(),
  points: z.number().min(0).max(1000).nullable().optional(),
  orderIndex: z.number().int().min(0),
  required: z.boolean().optional(),
});

export const updateEvaluationQuestionSchema = z.object({
  type: evaluationQuestionTypeSchema.optional(),
  questionText: z.string().min(1).max(1000).optional(),
  options: jsonValueSchema.nullable().optional(),
  correctAnswer: jsonValueSchema.nullable().optional(),
  points: z.number().min(0).max(1000).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
  required: z.boolean().optional(),
});

export const submitEvaluationAnswerSchema = z.object({
  organizationId: z.string().uuid(),
  enrollmentId: z.string().uuid().nullable().optional(),
  employeeId: z.string().uuid(),
  evaluationQuestionId: z.string().uuid(),
  answer: jsonValueSchema,
});

export const submitEvaluationSchema = z.object({
  organizationId: z.string().uuid(),
  enrollmentId: z.string().uuid().nullable().optional(),
  employeeId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        evaluationQuestionId: z.string().uuid(),
        answer: jsonValueSchema,
      }),
    )
    .min(1),
});
