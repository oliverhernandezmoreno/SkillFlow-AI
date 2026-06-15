import type { Instructor } from '../../domain/entities/instructor.entity.js';
import type { InstructorDto } from '../dto/instructor.dto.js';

export class InstructorMapper {
  static toDto(instructor: Instructor): InstructorDto {
    const props = instructor.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      userId: props.userId,
      providerId: props.providerId,
      rut: props.rut,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      normalizedEmail: props.normalizedEmail,
      phone: props.phone,
      specialties: props.specialties,
      status: props.status,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
