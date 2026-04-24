from pydantic import BaseModel, Field
from fastapi import APIRouter, Header, HTTPException

from app.schemas import LearningProfilePayload
from app.services.gemini_service import GeminiService


router = APIRouter(tags=["scenario"])


class ScenarioGenerateRequest(BaseModel):
    profile: LearningProfilePayload
    scenario: str = Field(default="Daily Conversation")


class ScenarioLine(BaseModel):
    speaker: str
    line: str
    translation: str


class ScenarioGenerateResponse(BaseModel):
    title: str
    context: str
    dialogue: list[ScenarioLine]
    pronunciation_focus: list[str]
    practice_line_indices: list[int]
    coach_note: str


@router.post("/scenario/generate", response_model=ScenarioGenerateResponse)
async def generate_scenario(
    payload: ScenarioGenerateRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> ScenarioGenerateResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    result = service.generate_scenario_dialogue(payload.profile, payload.scenario)
    return ScenarioGenerateResponse(**result)
