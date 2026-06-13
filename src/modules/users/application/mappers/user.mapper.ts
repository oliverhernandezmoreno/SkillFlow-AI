import type { User } from '../../domain/entities/user.entity.js';
import type { UserDto } from '../dto/user.dto.js';

export class UserMapper {
  static toDto(user: User): UserDto {
    const props = user.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
      status: props.status,
      roleIds: props.roleIds,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
