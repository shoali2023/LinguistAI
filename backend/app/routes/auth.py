from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.services.gemini_service import GeminiService


router = APIRouter(tags=["auth"])


class ApiKeyValidationResponse(BaseModel):
    valid: bool
    status: str
    message: str


@router.get("/auth/validate", response_model=ApiKeyValidationResponse)
async def validate_api_key(
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> ApiKeyValidationResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    service.validate_api_key()
    return ApiKeyValidationResponse(
        valid=True,
        status="approved",
        message="Gemini API key approved and ready for this session.",
    )
