import type { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type { OtecProfileDto } from '../dto/otec-profile.dto.js';

export class OtecProfileMapper {
  static toDto(profile: OtecProfile): OtecProfileDto {
    return profile.toPrimitives();
  }
}
