import type { HealthResponseDto } from '../dto/health-response.dto.js';

export class GetHealthStatusUseCase {
  execute(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
