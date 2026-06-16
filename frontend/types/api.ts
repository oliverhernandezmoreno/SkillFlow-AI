export interface ApiErrorPayload {
  message?: string;
  code?: string;
  details?: unknown;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
  permissions?: string[];
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
