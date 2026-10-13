import type { UserPublic, UserRole } from './user';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  exp: number;
  iat: number;
}
