
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const API_PREFIX = "/api/v1";

// Custom error that includes the HTTP status code.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Shared helper for communicating with CareerNet's backend.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Only allow paths within our own API.
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("API path must start with a single /.");
  }

  const apiPath =
    path === API_PREFIX || path.startsWith(`${API_PREFIX}/`)
      ? path
      : `${API_PREFIX}${path}`;

  const url = `${API_BASE_URL.replace(/\/+$/, "")}${apiPath}`;

  const headers = new Headers(options.headers);

  // Get the login token saved by AuthContext.
  const token = localStorage.getItem("access_token");

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // JSON requests need the correct content type.
  if (
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // The browser must set the multipart boundary for uploads.
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please try again."
    );
  }

  // Convert backend errors into readable messages.
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    const rawError = await response.text();

    if (rawError) {
      try {
        const errorData: unknown = JSON.parse(rawError);

        if (
          typeof errorData === "object" &&
          errorData !== null &&
          "detail" in errorData &&
          typeof errorData.detail === "string"
        ) {
          message = errorData.detail;
        } else if (
          typeof errorData === "object" &&
          errorData !== null &&
          "message" in errorData &&
          typeof errorData.message === "string"
        ) {
          message = errorData.message;
        }
      } catch {
        message = rawError;
      }
    }

    throw new ApiError(message, response.status);
  }

  // DELETE endpoints may return no content.
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType =
    response.headers.get("Content-Type") || "";

  // Return JSON for ordinary API calls.
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  // Return a Blob for file downloads.
  return (await response.blob()) as T;
}
