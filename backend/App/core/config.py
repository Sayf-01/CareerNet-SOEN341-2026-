import os

from dotenv import load_dotenv

load_dotenv()  # reads the .env file in the project root

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-secret-change-me-in-your-env-file")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Comma-separated list, e.g. "http://localhost:5173,http://127.0.0.1:5173"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]