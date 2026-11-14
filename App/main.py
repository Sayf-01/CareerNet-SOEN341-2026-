from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import App.models  # noqa: F401  (registers all tables)
from App.core import config
from App.database.base import Base
from App.database.connection import engine
from App.routers import auth, profile, resumes, applications, jobs, recruiter
from App.routers import application_status, application_stats, notifications
# TEMPORARY: creates missing tables on startup. Remove once Sayf/Kaila's Alembic migration exists.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CareerNet API", version="0.1.0")

# Allow the React dev server (another "origin") to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Preserve Sprint 1 registration errors while supporting Sprint 2 validation."""

    first_error = exc.errors()[0]
    field = str(first_error["loc"][-1])
    message = first_error["msg"].removeprefix("Value error, ")

    # Sprint 1 registration tests require HTTP 400.
    status_code = 400

    return JSONResponse(
        status_code=status_code,
        content={"detail": f"{field}: {message}"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/api/v1/health", tags=["health"])
def health():
    return {"status": "ok"}

app.include_router(auth.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(resumes.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(recruiter.router, prefix="/api/v1")
app.include_router(application_status.router, prefix="/api/v1")
app.include_router(application_stats.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")