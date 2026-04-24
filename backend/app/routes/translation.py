from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.schemas import TranslationAnalyzeRequest
from app.services.gemini_service import GeminiService


router = APIRouter(tags=["translation"])


class WordByWordItem(BaseModel):
    word: str
    meaning: str


class VocabularyItem(BaseModel):
    word: str
    meaning: str
    example: str


class TranslationAnalyzeResponse(BaseModel):
    translation: str
    word_by_word: list[WordByWordItem]
    vocabulary: list[VocabularyItem]
    explanations: str
    audio_translation_url: str | None = None


@router.post("/translation/analyze", response_model=TranslationAnalyzeResponse)
async def analyze_translation(
    payload: TranslationAnalyzeRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> TranslationAnalyzeResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    result = service.analyze_translation(payload)
    return TranslationAnalyzeResponse(**result)
