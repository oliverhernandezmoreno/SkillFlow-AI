import type { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import type { OtecAccreditationDto } from '../dto/otec-accreditation.dto.js';

export class OtecAccreditationMapper {
  static toDto(accreditation: OtecAccreditation): OtecAccreditationDto {
    return accreditation.toPrimitives();
  }
}
