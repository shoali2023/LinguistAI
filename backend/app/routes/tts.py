from pydantic import BaseModel, Field
from fastapi import APIRouter, Header, HTTPException

from app.services.gemini_service import GeminiService
from app.schemas import LearningProfilePayload


router = APIRouter(tags=["tts"])


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(default="Kore")
    style: str = Field(default="Neutral")
    learning_mode: str = Field(default="Normal speed")
    generation_type: str = Field(default="model_pronunciation")
    profile: LearningProfilePayload | None = None


class TTSResponse(BaseModel):
    audio_base64: str
    mime_type: str = "audio/wav"
    voice: str
    style: str
    prompt_used: str


@router.post("/tts", response_model=TTSResponse)
async def synthesize_speech(
    payload: TTSRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> TTSResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    result = service.generate_tts(
        text=payload.text,
        voice_name=payload.voice,
        style=payload.style,
        profile=payload.profile,
        learning_mode=payload.learning_mode,
        generation_type=payload.generation_type,
    )
    return TTSResponse(**result)


class AudioFeedbackRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(default="Kore")
    style: str = Field(default="Friendly")
    profile: LearningProfilePayload | None = None


@router.post("/audio-feedback", response_model=TTSResponse)
async def generate_audio_feedback(
    payload: AudioFeedbackRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> TTSResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    result = service.generate_audio_feedback(
        text=payload.text,
        voice_name=payload.voice,
        style=payload.style,
        profile=payload.profile,
    )
    return TTSResponse(**result)
