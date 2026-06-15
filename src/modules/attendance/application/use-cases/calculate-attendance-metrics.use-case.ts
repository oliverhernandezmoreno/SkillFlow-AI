import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { TrainingSessionRepository } from '../../../training-sessions/domain/repositories/training-session.repository.js';
import type { AttendanceRepository } from '../../domain/repositories/attendance.repository.js';
import type { AttendanceMetricsDto } from '../dto/attendance.dto.js';
import { AttendanceMapper } from '../mappers/attendance.mapper.js';

export class CalculateAttendanceMetricsUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
  ) {}

  async execute(
    attendanceId: string,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<AttendanceMetricsDto> {
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

    const attendanceProps = attendanceRecord.toPrimitives();
    const trainingSession = await this.trainingSessionRepository.findById(
      attendanceProps.trainingSessionId,
      context.organizationId,
    );
    if (!trainingSession) {
      throw new NotFoundError('Training session not found');
    }

    const trainingSessionProps = trainingSession.toPrimitives();
    return AttendanceMapper.toMetricsDto(
      attendanceRecord,
      attendanceRecord.calculateMetrics(
        trainingSessionProps.startDate,
        trainingSessionProps.endDate,
      ),
    );
  }
}
