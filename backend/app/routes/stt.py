from time import perf_counter
from typing import Any

from fastapi import APIRouter, BackgroundTasks, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

from app.schemas import ResponseMetadata, parse_learning_profile_json
from app.services.gemini_service import GeminiService
from app.utils.audio_processing import cleanup_file, normalize_audio_mime_type, persist_upload_file


router = APIRouter(tags=["stt"])


class STTResponse(BaseModel):
    transcript: str
    summary: str
    keywords: list[str]
    tone: str
    study_notes: list[str]
    vocabulary: list[dict[str, Any]]
    difficult_words: list[dict[str, Any]]
    suggested_practice: list[str]
    confidence: int
    metadata: ResponseMetadata


@router.post("/stt", response_model=STTResponse)
async def transcribe_and_analyze(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    profile: str | None = Form(default=None),
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> STTResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    try:
        mime_type = normalize_audio_mime_type(file.content_type, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    temp_path = await persist_upload_file(file)
    background_tasks.add_task(cleanup_file, temp_path)

    service = GeminiService(api_key=x_gemini_api_key)
    learner_profile = parse_learning_profile_json(profile)
    start_time = perf_counter()
    result = service.transcribe_and_analyze_audio(temp_path, mime_type, learner_profile)
    processing_time = round(perf_counter() - start_time, 3)
    model_used = str(result.pop("_model_used", ""))
    result["metadata"] = ResponseMetadata(
        processing_time_seconds=processing_time,
        model=model_used,
        model_display=service.get_model_display_name(model_used),
        confidence=int(result.get("confidence", 0) or 0),
    )
    return STTResponse(**result)
