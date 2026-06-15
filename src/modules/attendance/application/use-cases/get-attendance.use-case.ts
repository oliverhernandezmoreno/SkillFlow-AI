import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceRecordDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';

export class GetAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(
    attendanceId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<AttendanceRecordDto> {
    if (!context.organizationId) {
      throw new NotFoundError('Attendance record not found');
    }

    const attendanceRecord = await this.attendanceRepository.findById(
      attendanceId,
      context.organizationId,
    );
    if (!attendanceRecord) {
      throw new NotFoundError('Attendance record not found');
    }

    return AttendanceMapper.toDto(attendanceRecord);
  }
}
