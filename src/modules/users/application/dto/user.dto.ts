import type { UserStatus } from '../../domain/entities/user.entity.js';

export interface UserDto {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roleIds: string[];
  password?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  status?: UserStatus;
  roleIds?: string[];
  password?: string;
}
