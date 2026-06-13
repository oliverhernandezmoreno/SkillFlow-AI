import type { UserDto } from '../../../users/application/dto/user.dto.js';

export interface RegisterDto {
  organizationName: string;
  taxId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}
