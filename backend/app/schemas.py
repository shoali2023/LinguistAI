import json
from typing import Literal

from pydantic import BaseModel, Field


class LearningProfilePayload(BaseModel):
    native_language: str = "English"
    target_language: str = "English"
    interface_language: str = "English"
    level: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    learning_goal: str = "Daily Conversation"
    feedback_style: Literal["Gentle", "Detailed", "Strict", "Encouraging"] = "Encouraging"
    preferred_voice_style: Literal["Professional", "Friendly", "Slow", "Energetic", "Neutral"] = "Friendly"
    weak_points: list[str] = Field(default_factory=list)


class TranslationOptionsPayload(BaseModel):
    word_by_word: bool = False
    vocabulary: bool = True
    explanations: bool = True
    learning_mode: Literal["Normal speed", "Slow reading", "Word-by-word playback", "Emphasized pronunciation"] = "Normal speed"


class TranslationAnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    native_language: str = "English"
    target_language: str = "English"
    mode: Literal["text", "voice", "both"] = "text"
    options: TranslationOptionsPayload = Field(default_factory=TranslationOptionsPayload)


def parse_learning_profile_json(raw: str | None) -> LearningProfilePayload | None:
    if not raw:
        return None
    return LearningProfilePayload.model_validate(json.loads(raw))
