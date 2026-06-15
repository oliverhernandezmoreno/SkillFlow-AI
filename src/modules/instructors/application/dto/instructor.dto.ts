import type { InstructorStatus } from '../../domain/entities/instructor.entity.js';

export interface InstructorDto {
  id: string;
  organizationId: string;
  userId: string | null;
  providerId: string | null;
  rut: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  normalizedEmail: string | null;
  phone: string | null;
  specialties: string[];
  status: InstructorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstructorDto {
  organizationId: string;
  userId?: string | null;
  providerId?: string | null;
  rut?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  specialties?: string[];
}

export interface UpdateInstructorDto {
  userId?: string | null;
  providerId?: string | null;
  rut?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  specialties?: string[];
  status?: InstructorStatus;
}
