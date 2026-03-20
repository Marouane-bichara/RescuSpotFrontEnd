export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  role?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface AppUser {
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}
