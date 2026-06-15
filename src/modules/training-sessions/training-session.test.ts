import { describe, expect, it } from 'vitest';

import { BadRequestError, NotFoundError } from '../../shared/domain/errors.js';
import { CreateTrainingSessionUseCase } from './application/use-cases/create-training-session.use-case.js';
import { GetTrainingSessionUseCase } from './application/use-cases/get-training-session.use-case.js';
import { PublishTrainingSessionUseCase } from './application/use-cases/publish-training-session.use-case.js';
import type { TrainingSession } from './domain/entities/training-session.entity.js';
import type { TrainingSessionRepository } from './domain/repositories/training-session.repository.js';
import { createTrainingSessionSchema } from './interfaces/http/validators/training-session.validators.js';

class FakeTrainingSessionRepository implements TrainingSessionRepository {
  trainingSessions: TrainingSession[] = [];

  async findById(id: string, organizationId: string): Promise<TrainingSession | null> {
    return (
      this.trainingSessions.find((trainingSession) => {
        const props = trainingSession.toPrimitives();
        return trainingSession.id === id && props.organizationId === organizationId;
      }) ?? null
    );
  }

  async search() {
    return {
      data: this.trainingSessions,
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
  }

  async save(trainingSession: TrainingSession): Promise<void> {
    this.trainingSessions.push(trainingSession);
  }

  async update(trainingSession: TrainingSession): Promise<void> {
    const props = trainingSession.toPrimitives();
    this.trainingSessions = this.trainingSessions.map((current) => {
      const currentProps = current.toPrimitives();
      return current.id === trainingSession.id &&
        currentProps.organizationId === props.organizationId
        ? trainingSession
        : current;
    });
  }
}

const organizationId = '11111111-1111-4111-8111-111111111111';
const courseId = '33333333-3333-4333-8333-333333333333';
const startDate = '2026-07-10T13:00:00.000Z';
const endDate = '2026-07-10T17:00:00.000Z';

describe('Training Sessions module', () => {
  it('validates create training session input', () => {
    expect(() =>
      createTrainingSessionSchema.parse({
        organizationId,
        courseId,
        name: 'Safety induction July',
        startDate,
        endDate,
        capacity: 25,
      }),
    ).not.toThrow();
  });

  it('creates a training session in DRAFT status', async () => {
    const result = await new CreateTrainingSessionUseCase(new FakeTrainingSessionRepository()).execute(
      {
        organizationId,
        courseId,
        name: 'Safety induction July',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: 25,
      },
    );

    expect(result.status).toBe('DRAFT');
    expect(result.courseId).toBe(courseId);
  });

  it('rejects sessions whose end date is not after the start date', async () => {
    await expect(
      new CreateTrainingSessionUseCase(new FakeTrainingSessionRepository()).execute({
        organizationId,
        courseId,
        name: 'Invalid schedule',
        startDate: new Date(endDate),
        endDate: new Date(startDate),
        capacity: 25,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('publishes a draft training session', async () => {
    const repository = new FakeTrainingSessionRepository();
    const created = await new CreateTrainingSessionUseCase(repository).execute({
      organizationId,
      courseId,
      name: 'Safety induction July',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity: 25,
    });

    const published = await new PublishTrainingSessionUseCase(repository).execute(created.id, {
      organizationId,
      actorUserId: null,
    });

    expect(published.status).toBe('PUBLISHED');
  });

  it('does not read training sessions across tenants', async () => {
    const repository = new FakeTrainingSessionRepository();
    const created = await new CreateTrainingSessionUseCase(repository).execute({
      organizationId,
      courseId,
      name: 'Safety induction July',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity: 25,
    });

    await expect(
      new GetTrainingSessionUseCase(repository).execute(created.id, {
        organizationId: '22222222-2222-4222-8222-222222222222',
        actorUserId: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
