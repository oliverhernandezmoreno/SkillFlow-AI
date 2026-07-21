import type { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import type { OtecResolutionDto } from '../dto/otec-resolution.dto.js';
export class OtecResolutionMapper {
  static toDto(entity: OtecResolution): OtecResolutionDto {
    return entity.toPrimitives();
  }
}
