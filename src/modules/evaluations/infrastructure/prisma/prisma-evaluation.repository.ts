import {
  Prisma,
  type Evaluation as PrismaEvaluation,
  type EvaluationAnswer as PrismaEvaluationAnswer,
  type EvaluationQuestion as PrismaEvaluationQuestion,
  type EvaluationQuestionType as PrismaEvaluationQuestionType,
  type EvaluationResponse as PrismaEvaluationResponse,
  type EvaluationType as PrismaEvaluationType,
  type PrismaClient,
} from '@prisma/client';

import {
  createPaginationMeta,
  type PaginatedResult,
  type PaginationInput,
} from '../../../../shared/application/pagination.js';
import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { Evaluation, type EvaluationType } from '../../domain/entities/evaluation.entity.js';
import { EvaluationAnswer } from '../../domain/entities/evaluation-answer.entity.js';
import {
  EvaluationQuestion,
  type EvaluationQuestionType,
  type JsonValue,
} from '../../domain/entities/evaluation-question.entity.js';
import { EvaluationResponseEntity } from '../../domain/entities/evaluation-response.entity.js';
import type {
  EvaluationRepository,
  EvaluationSearchFilters,
} from '../../domain/repositories/evaluation.repository.js';

export class PrismaEvaluationRepository implements EvaluationRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async findById(id: string, organizationId: string): Promise<Evaluation | null> {
    const record = await this.prisma.evaluation.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return record ? this.toEvaluationDomain(record) : null;
  }

  async search(
    filters: EvaluationSearchFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Evaluation>> {
    const where: Prisma.EvaluationWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };
    if (filters.trainingSessionId) {
      where.trainingSessionId = filters.trainingSessionId;
    }
    if (filters.type) {
      where.type = toPrismaEvaluationType(filters.type);
    }
    if (filters.enrollmentId || filters.employeeId) {
      where.responses = {
        some: {
          organizationId: filters.organizationId,
          deletedAt: null,
          ...(filters.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
          ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        },
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.evaluation.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.evaluation.count({ where }),
    ]);

    return {
      data: records.map((record) => this.toEvaluationDomain(record)),
      meta: createPaginationMeta(pagination, total),
    };
  }

  async save(evaluation: Evaluation): Promise<void> {
    const props = evaluation.toPrimitives();
    await this.prisma.evaluation.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        trainingSessionId: props.trainingSessionId,
        type: toPrismaEvaluationType(props.type),
        title: props.title,
        description: props.description,
        passingScore: props.passingScore === null ? null : new Prisma.Decimal(props.passingScore),
        closedAt: props.closedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async update(evaluation: Evaluation): Promise<void> {
    const props = evaluation.toPrimitives();
    await this.prisma.evaluation.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        type: toPrismaEvaluationType(props.type),
        title: props.title,
        description: props.description,
        passingScore: props.passingScore === null ? null : new Prisma.Decimal(props.passingScore),
        closedAt: props.closedAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async addQuestion(question: EvaluationQuestion): Promise<void> {
    const props = question.toPrimitives();
    await this.prisma.evaluationQuestion.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        evaluationId: props.evaluationId,
        type: toPrismaQuestionType(props.type),
        questionText: props.questionText,
        options: toPrismaJson(props.options),
        correctAnswer: toPrismaJson(props.correctAnswer),
        points: props.points === null ? null : new Prisma.Decimal(props.points),
        orderIndex: props.orderIndex,
        required: props.required,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async updateQuestion(question: EvaluationQuestion): Promise<void> {
    const props = question.toPrimitives();
    await this.prisma.evaluationQuestion.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        type: toPrismaQuestionType(props.type),
        questionText: props.questionText,
        options: toPrismaJson(props.options),
        correctAnswer: toPrismaJson(props.correctAnswer),
        points: props.points === null ? null : new Prisma.Decimal(props.points),
        orderIndex: props.orderIndex,
        required: props.required,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async findQuestionById(
    evaluationId: string,
    questionId: string,
    organizationId: string,
  ): Promise<EvaluationQuestion | null> {
    const record = await this.prisma.evaluationQuestion.findFirst({
      where: { id: questionId, evaluationId, organizationId, deletedAt: null },
    });
    return record ? this.toQuestionDomain(record) : null;
  }

  async findQuestions(evaluationId: string, organizationId: string): Promise<EvaluationQuestion[]> {
    const records = await this.prisma.evaluationQuestion.findMany({
      where: { evaluationId, organizationId, deletedAt: null },
      orderBy: { orderIndex: 'asc' },
    });
    return records.map((record) => this.toQuestionDomain(record));
  }

  async findResponseByEvaluationAndEmployee(
    evaluationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<EvaluationResponseEntity | null> {
    const record = await this.prisma.evaluationResponse.findUnique({
      where: { evaluationId_employeeId: { evaluationId, employeeId } },
    });
    return record?.organizationId === organizationId && !record.deletedAt
      ? this.toResponseDomain(record)
      : null;
  }

  async saveResponseWithAnswers(
    response: EvaluationResponseEntity,
    answers: EvaluationAnswer[],
  ): Promise<void> {
    const responseProps = response.toPrimitives();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.evaluationResponse.create({
        data: {
          id: responseProps.id,
          organizationId: responseProps.organizationId,
          evaluationId: responseProps.evaluationId,
          enrollmentId: responseProps.enrollmentId,
          employeeId: responseProps.employeeId,
          score: responseProps.score === null ? null : new Prisma.Decimal(responseProps.score),
          passed: responseProps.passed,
          answersPayload: toPrismaJson(responseProps.answersPayload),
          submittedAt: responseProps.submittedAt,
          createdAt: responseProps.createdAt,
          updatedAt: responseProps.updatedAt,
          deletedAt: responseProps.deletedAt,
          version: responseProps.version,
        },
      });
      for (const answer of answers) {
        const props = answer.toPrimitives();
        await transaction.evaluationAnswer.create({
          data: {
            id: props.id,
            organizationId: props.organizationId,
            evaluationResponseId: props.evaluationResponseId,
            evaluationQuestionId: props.evaluationQuestionId,
            employeeId: props.employeeId,
            answer: toPrismaJson(props.answer),
            score: props.score === null ? null : new Prisma.Decimal(props.score),
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            deletedAt: props.deletedAt,
            version: props.version,
          },
        });
      }
    });
  }

  async updateResponse(response: EvaluationResponseEntity): Promise<void> {
    const props = response.toPrimitives();
    await this.prisma.evaluationResponse.update({
      where: { id_organizationId: { id: props.id, organizationId: props.organizationId } },
      data: {
        score: props.score === null ? null : new Prisma.Decimal(props.score),
        passed: props.passed,
        answersPayload: toPrismaJson(props.answersPayload),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async saveResponseWithAnswer(
    response: EvaluationResponseEntity,
    answer: EvaluationAnswer,
  ): Promise<void> {
    await this.saveResponseWithAnswers(response, [answer]);
  }

  async addAnswer(answer: EvaluationAnswer): Promise<void> {
    const props = answer.toPrimitives();
    await this.prisma.evaluationAnswer.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        evaluationResponseId: props.evaluationResponseId,
        evaluationQuestionId: props.evaluationQuestionId,
        employeeId: props.employeeId,
        answer: toPrismaJson(props.answer),
        score: props.score === null ? null : new Prisma.Decimal(props.score),
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        version: props.version,
      },
    });
  }

  async findAnswersByResponse(
    evaluationResponseId: string,
    organizationId: string,
  ): Promise<EvaluationAnswer[]> {
    const records = await this.prisma.evaluationAnswer.findMany({
      where: { evaluationResponseId, organizationId, deletedAt: null },
    });
    return records.map((record) => this.toAnswerDomain(record));
  }

  private toEvaluationDomain(record: PrismaEvaluation): Evaluation {
    return Evaluation.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      trainingSessionId: record.trainingSessionId,
      type: fromPrismaEvaluationType(record.type),
      title: record.title,
      description: record.description,
      passingScore: record.passingScore === null ? null : Number(record.passingScore),
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }

  private toQuestionDomain(record: PrismaEvaluationQuestion): EvaluationQuestion {
    return EvaluationQuestion.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      evaluationId: record.evaluationId,
      type: fromPrismaQuestionType(record.type),
      questionText: record.questionText,
      options: fromPrismaJson(record.options),
      correctAnswer: fromPrismaJson(record.correctAnswer),
      points: record.points === null ? null : Number(record.points),
      orderIndex: record.orderIndex,
      required: record.required,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }

  private toResponseDomain(record: PrismaEvaluationResponse): EvaluationResponseEntity {
    return EvaluationResponseEntity.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      evaluationId: record.evaluationId,
      enrollmentId: record.enrollmentId,
      employeeId: record.employeeId,
      score: record.score === null ? null : Number(record.score),
      passed: record.passed,
      answersPayload: fromPrismaJson(record.answersPayload),
      submittedAt: record.submittedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }

  private toAnswerDomain(record: PrismaEvaluationAnswer): EvaluationAnswer {
    return EvaluationAnswer.rehydrate({
      id: record.id,
      organizationId: record.organizationId,
      evaluationResponseId: record.evaluationResponseId,
      evaluationQuestionId: record.evaluationQuestionId,
      employeeId: record.employeeId,
      answer: fromPrismaJson(record.answer) ?? null,
      score: record.score === null ? null : Number(record.score),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      version: record.version,
    });
  }
}

function toPrismaEvaluationType(type: EvaluationType): PrismaEvaluationType {
  return type;
}

function fromPrismaEvaluationType(type: PrismaEvaluationType): EvaluationType {
  return type;
}

function toPrismaQuestionType(type: EvaluationQuestionType): PrismaEvaluationQuestionType {
  return type;
}

function fromPrismaQuestionType(type: PrismaEvaluationQuestionType): EvaluationQuestionType {
  return type;
}

function toPrismaJson(value: JsonValue | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function fromPrismaJson(value: Prisma.JsonValue | null): JsonValue | null {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fromPrismaJson(item));
  }
  if (typeof value === 'object') {
    const output: Record<string, JsonValue> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = nestedValue === undefined ? null : fromPrismaJson(nestedValue);
    }
    return output;
  }
  return value;
}
