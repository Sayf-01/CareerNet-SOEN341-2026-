
export type UserRole = "JOB_SEEKER" | "RECRUITER";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface ApiErrorDetail {
  detail?: string;
  message?: string;
  error?: string;
}
