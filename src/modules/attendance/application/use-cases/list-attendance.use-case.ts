import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { ForbiddenError } from '../../../../shared/domain/errors.js';
import type { AttendanceStatus } from '../../domain/entities/attendance-record.entity.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';

export interface ListAttendanceInput {
  organizationId: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  enrollmentId?: string | undefined;
  trainingSessionId?: string | undefined;
  employeeId?: string | undefined;
  status?: AttendanceStatus | undefined;
}

export class ListAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(
    input: ListAttendanceInput,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<{ data: AttendanceRecordDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
    if (context.organizationId && context.organizationId !== input.organizationId) {
      throw new ForbiddenError('Organization access denied');
    }

    const result = await this.attendanceRepository.search(
      {
        organizationId: input.organizationId,
        enrollmentId: input.enrollmentId,
        trainingSessionId: input.trainingSessionId,
        employeeId: input.employeeId,
        status: input.status,
      },
      createPagination({ page: input.page, pageSize: input.pageSize }),
    );

    return {
      data: result.data.map(AttendanceMapper.toDto),
      meta: result.meta,
    };
  }
}
