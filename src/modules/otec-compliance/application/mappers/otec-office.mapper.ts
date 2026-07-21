import type { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import type { OtecOfficeDto } from '../dto/otec-office.dto.js';
export class OtecOfficeMapper {
  static toDto(entity: OtecOffice): OtecOfficeDto {
    return entity.toPrimitives();
  }
}
