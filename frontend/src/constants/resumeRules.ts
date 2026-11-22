
export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_TYPES = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const RESUME_ACCEPT = ".pdf,.doc,.docx";

export const RESUME_VALIDATION_ERROR =
  "Only PDF or Word files up to 5 MB are allowed.";

export function validateResumeFile(file: File): string | null {
  const extension = file.name
    .toLowerCase()
    .match(/\.[^.]+$/)?.[0];

  if (
    !extension ||
    !(extension in ALLOWED_RESUME_TYPES)
  ) {
    return RESUME_VALIDATION_ERROR;
  }

  const expectedType =
    ALLOWED_RESUME_TYPES[
      extension as keyof typeof ALLOWED_RESUME_TYPES
    ];

  // Some browsers do not provide a MIME type for Word files.
  if (file.type && file.type !== expectedType) {
    return RESUME_VALIDATION_ERROR;
  }

  if (file.size > MAX_RESUME_SIZE || file.size === 0) {
    return RESUME_VALIDATION_ERROR;
  }

  return null;
}
