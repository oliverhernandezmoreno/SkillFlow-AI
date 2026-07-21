import type { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import type { QualityCertificationDto } from '../dto/quality-certification.dto.js';
export class QualityCertificationMapper {
  static toDto(item: QualityCertification): QualityCertificationDto {
    return item.toPrimitives();
  }
}
