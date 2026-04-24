from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import re

from google.genai.errors import APIError

from app.routes.auth import router as auth_router
from app.routes.scenario import router as scenario_router
from app.routes.stt import router as stt_router
from app.routes.translation import router as translation_router
from app.routes.tts import router as tts_router
from app.routes.tutor import router as tutor_router


app = FastAPI(
    title="LinguistAI API",
    version="1.0.0",
    description="Speech learning and voice interaction platform powered by Gemini.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts_router, prefix="/api")
app.include_router(stt_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(scenario_router, prefix="/api")
app.include_router(translation_router, prefix="/api")


@app.exception_handler(APIError)
async def handle_gemini_api_error(_: Request, exc: APIError) -> JSONResponse:
    status_code = getattr(exc, "status_code", 502) or 502
    raw_message = str(exc)
    message = raw_message or "Gemini request failed."
    error_type = "gemini_error"
    retry_after_seconds = None

    retry_match = re.search(r"Please retry in ([\d.]+)s", raw_message)
    if retry_match:
        retry_after_seconds = max(1, round(float(retry_match.group(1))))

    if status_code == 503:
        message = "Gemini is temporarily under high demand. Please try again in a moment."
        error_type = "service_busy"
    elif status_code == 401:
        message = "The provided Gemini API key was rejected."
        error_type = "invalid_api_key"
    elif status_code == 429:
        error_type = "rate_limited"
        if "gemini-3.1-flash-tts" in raw_message or "gemini-3.1-flash-tts-preview" in raw_message:
            error_type = "tts_quota_reached"
            if retry_after_seconds:
                message = f"TTS quota reached. Please wait {retry_after_seconds} seconds and try again."
            else:
                message = "TTS quota reached. Please wait a moment and try again."
        else:
            if retry_after_seconds:
                message = f"Gemini rate limit reached. Please wait {retry_after_seconds} seconds and try again."
            else:
                message = "Gemini rate limit reached. Please slow down and retry."

    return JSONResponse(
        status_code=status_code,
        content={
            "detail": message,
            "provider_status": status_code,
            "error_type": error_type,
            "retry_after_seconds": retry_after_seconds,
        },
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {str(exc)}"},
    )


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
