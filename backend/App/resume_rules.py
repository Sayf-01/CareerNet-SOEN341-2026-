# Largest resume allowed: 5 MB
MAX_RESUME_BYTES = 5 * 1024 * 1024

# Allowed file types: PDF, and the two Word formats (.doc and .docx)
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}