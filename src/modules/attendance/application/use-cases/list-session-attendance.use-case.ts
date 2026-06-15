import { createPagination } from '../../../../shared/application/pagination.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';

export class ListSessionAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(
    trainingSessionId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<{ data: AttendanceRecordDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
    if (!context.organizationId) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await this.attendanceRepository.search(
      { organizationId: context.organizationId, trainingSessionId },
      createPagination({}),
    );

    return { data: result.data.map(AttendanceMapper.toDto), meta: result.meta };
  }
}
