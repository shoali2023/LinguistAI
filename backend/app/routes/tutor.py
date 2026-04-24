from fastapi import APIRouter, BackgroundTasks, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.schemas import LearningProfilePayload, parse_learning_profile_json
from app.services.gemini_service import GeminiService
from app.utils.audio_processing import cleanup_file, normalize_audio_mime_type, persist_upload_file


router = APIRouter(tags=["tutor"])


class PracticeGenerateRequest(BaseModel):
    profile: LearningProfilePayload
    scenario: str = Field(default="Daily Conversation")


class PracticeExplainRequest(BaseModel):
    profile: LearningProfilePayload
    sentence: str = Field(min_length=1, max_length=5000)
    scenario: str = Field(default="Daily Conversation")


class PracticeGenerateResponse(BaseModel):
    sentence: str
    translation: str
    difficulty: str
    focus_points: list[str]
    expected_pronunciation_challenges: list[str]
    short_explanation: str


class ContrastiveInsight(BaseModel):
    issue: str
    why_it_happens: str
    how_to_practice: str
    example: str


class PronunciationToken(BaseModel):
    token: str
    status: str


class PronunciationResponse(BaseModel):
    transcription: str
    score: int
    fluency: int
    accuracy: int
    pronunciation: int
    rhythm: int
    missing_words: list[str]
    wrong_words: list[str]
    correct_words: list[str]
    weak_points: list[str]
    native_language_feedback: str
    target_language_tip: str
    contrastive_tip: str
    improvement_tips: list[str]
    next_recommended_exercise: str
    encouragement: str
    contrastive_insight: ContrastiveInsight
    overlay_tokens: list[PronunciationToken]


@router.post("/practice/generate", response_model=PracticeGenerateResponse)
async def generate_practice_sentence(
    payload: PracticeGenerateRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> PracticeGenerateResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    response = service.generate_practice_sentence(payload.profile, payload.scenario)
    return PracticeGenerateResponse(**response)


@router.post("/practice/explain", response_model=PracticeGenerateResponse)
async def explain_practice_sentence(
    payload: PracticeExplainRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> PracticeGenerateResponse:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")

    service = GeminiService(api_key=x_gemini_api_key)
    response = service.explain_practice_sentence(payload.profile, payload.sentence, payload.scenario)
    return PracticeGenerateResponse(**response)


@router.post("/pronunciation/analyze", response_model=PronunciationResponse)
async def analyze_pronunciation(
    background_tasks: BackgroundTasks,
    target_text: str = Form(...),
    file: UploadFile = File(...),
    profile: str | None = Form(default=None),
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> PronunciationResponse:
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
    result = service.analyze_pronunciation(
        target_text=target_text,
        audio_path=temp_path,
        mime_type=mime_type,
        profile=learner_profile,
    )
    return PronunciationResponse(**result)
