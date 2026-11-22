import axios, { AxiosError, AxiosHeaders } from "axios";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ApiErrorDetail,
} from "../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// (Stage D): fake backend switch ---> read from the .env file
// "true" = use the fake login below, anything else = call the real backend
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// (Stage D): the fake backend ---> pretends to be the backend until the real one exists
// any email + password "password123" = success, anything else = "wrong password"
// ⚠ address + response shape are NOT confirmed with the backend team yet
async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  // wait 1 second ---> so we can actually see the loading state
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (payload.password !== "password123") {
    // build the same kind of error axios gives when the real backend says 401
    // ---> so getAuthErrorMessage below handles fake + real errors the same way
    const config = { headers: new AxiosHeaders() };
    throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
      data: { detail: "Incorrect email or password." },
    });
  }

  return {
    access_token: "mock-token-123",
    token_type: "bearer",
    user: {
      id: 1,
      full_name: "Mock User",
      email: payload.email,
      role: "JOB_SEEKER",
    },
  };
}

export const authService = {
  /**
   * Register a new user.
   * POST /api/auth/register
   */
  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    // Map camelCase to backend snake_case expectations:
    const backendPayload = {
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    };

    const response = await api.post<RegisterResponse>(
      "/api/v1/auth/register",
      backendPayload
    );

    return response.data;
  },

  /**
   * (Stage D): Log a user in.
   * POST /api/auth/login ---> same address style as register (still to confirm)
   * sends { email, password }, gets back { access_token, token_type, user }
   */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    if (USE_MOCK_AUTH) {
      return mockLogin(payload);
    }

    const response = await api.post<LoginResponse>("/api/v1/auth/login", payload);
    return response.data;
  },
};

/**
 * Helper to extract a user-friendly error message from Axios errors.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorDetail>;
    const data = axiosError.response?.data;

    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    if (axiosError.response?.status === 409) {
      return "An account with this email already exists.";
    }

    if (axiosError.response?.status === 400) {
      return "Invalid registration data. Please check your inputs.";
    }

    if (axiosError.response?.status === 500) {
      return "Server error. Please try again later.";
    }
  }

  return "Something went wrong. Please try again.";
}

export default api;