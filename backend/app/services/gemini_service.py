import base64
import json
import time
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.prompts import (
    build_practice_explain_prompt,
    build_practice_generation_prompt,
    build_pronunciation_prompt,
    build_scenario_prompt,
    build_stt_prompt,
    build_translation_prompt,
    build_tts_prompt,
)
from app.schemas import LearningProfilePayload, TranslationAnalyzeRequest
from app.utils.audio_processing import pcm_to_wav_bytes


TTS_MODEL = "gemini-3.1-flash-tts-preview"
AUDIO_MODEL = "gemini-2.5-flash"
FALLBACK_AUDIO_MODELS = ["gemini-2.0-flash"]

STYLE_MAP = {
    "Neutral": "calm, balanced, and natural",
    "Professional": "clear, polished, and authoritative",
    "Friendly": "warm, approachable, and encouraging",
    "Slow": "deliberate, patient, and slightly slower than normal",
    "Energetic": "lively, expressive, and high-energy",
}

VOICE_WHITELIST = {"Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda"}

PRONUNCIATION_PROMPT = (
    "Act as a professional phonetics coach. Compare the provided audio to the target "
    "text: {target_text}. Analyze word stress, vowel length, and omissions. Return JSON: "
    "{ 'fluency_score': int, 'accuracy_breakdown': { 'correct':, 'missing':, 'wrong': }, "
    "'feedback': string }."
)


class GeminiService:
    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)

    def validate_api_key(self) -> None:
        self.client.models.generate_content(
            model=AUDIO_MODEL,
            contents="Reply with the single word OK.",
            config=types.GenerateContentConfig(
                max_output_tokens=3,
            ),
        )

    def generate_tts(
        self,
        text: str,
        voice_name: str,
        style: str,
        profile: LearningProfilePayload | None = None,
        learning_mode: str = "Normal speed",
        generation_type: str = "model_pronunciation",
    ) -> dict[str, Any]:
        clean_voice = voice_name if voice_name in VOICE_WHITELIST else "Kore"
        style_description = STYLE_MAP.get(style, STYLE_MAP["Neutral"])
        tagged_text = self._apply_expressive_tags(text)
        prompt = build_tts_prompt(
            text=tagged_text,
            voice_name=clean_voice,
            style_description=style_description,
            learning_mode=learning_mode,
            generation_type=generation_type,
            profile=profile,
        )

        response = self.client.models.generate_content(
            model=TTS_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=clean_voice
                        )
                    )
                ),
            ),
        )

        audio_bytes = response.candidates[0].content.parts[0].inline_data.data
        wav_bytes = pcm_to_wav_bytes(audio_bytes)
        return {
            "audio_base64": base64.b64encode(wav_bytes).decode("utf-8"),
            "mime_type": "audio/wav",
            "voice": clean_voice,
            "style": style,
            "prompt_used": prompt,
        }

    def transcribe_and_analyze_audio(
        self,
        audio_path: Path,
        mime_type: str,
        profile: LearningProfilePayload | None = None,
    ) -> dict[str, Any]:
        uploaded = self.client.files.upload(
            file=str(audio_path),
            config={"mime_type": mime_type},
        )
        prompt = build_stt_prompt(profile)
        response = self._generate_with_retries(
            model=AUDIO_MODEL,
            contents=[prompt, uploaded],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed["study_notes"] = self._ensure_string_list(parsed.get("study_notes"))
        parsed["keywords"] = self._ensure_string_list(parsed.get("keywords"))
        parsed["vocabulary"] = self._ensure_object_list(parsed.get("vocabulary"))
        parsed["difficult_words"] = self._ensure_object_list(parsed.get("difficult_words"))
        parsed["suggested_practice"] = self._ensure_string_list(parsed.get("suggested_practice"))
        return parsed

    def analyze_pronunciation(
        self,
        target_text: str,
        audio_path: Path,
        mime_type: str,
        profile: LearningProfilePayload | None = None,
    ) -> dict[str, Any]:
        uploaded = self.client.files.upload(
            file=str(audio_path),
            config={"mime_type": mime_type},
        )
        prompt = build_pronunciation_prompt(target_text=target_text, profile=profile)
        response = self._generate_with_model_fallbacks(
            models=[AUDIO_MODEL, *FALLBACK_AUDIO_MODELS],
            contents=[prompt, uploaded],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed.setdefault("transcription", "")
        parsed.setdefault("score", 0)
        parsed.setdefault("fluency", 0)
        parsed.setdefault("accuracy", 0)
        parsed.setdefault("pronunciation", 0)
        parsed.setdefault("rhythm", 0)
        parsed.setdefault("missing_words", [])
        parsed.setdefault("wrong_words", [])
        parsed.setdefault("correct_words", [])
        parsed.setdefault("weak_points", [])
        parsed.setdefault("native_language_feedback", "")
        parsed.setdefault("target_language_tip", "")
        parsed.setdefault("contrastive_tip", "")
        parsed.setdefault("improvement_tips", [])
        parsed.setdefault("next_recommended_exercise", "")
        parsed.setdefault("encouragement", "")
        parsed.setdefault(
            "contrastive_insight",
            {
                "issue": parsed.get("contrastive_tip", ""),
                "why_it_happens": "",
                "how_to_practice": "",
                "example": "",
            },
        )
        parsed.setdefault("overlay_tokens", self._build_overlay_tokens(target_text, parsed))
        return parsed

    def generate_practice_sentence(self, profile: LearningProfilePayload, scenario: str) -> dict[str, Any]:
        prompt = build_practice_generation_prompt(profile=profile, scenario=scenario)
        response = self.client.models.generate_content(
            model=AUDIO_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed.setdefault("sentence", "")
        parsed.setdefault("translation", "")
        parsed.setdefault("difficulty", profile.level)
        parsed.setdefault("focus_points", [])
        parsed.setdefault("expected_pronunciation_challenges", [])
        parsed.setdefault("short_explanation", "")
        return parsed

    def explain_practice_sentence(self, profile: LearningProfilePayload, sentence: str, scenario: str) -> dict[str, Any]:
        prompt = build_practice_explain_prompt(profile=profile, sentence=sentence, scenario=scenario)
        response = self.client.models.generate_content(
            model=AUDIO_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed.setdefault("sentence", sentence)
        parsed.setdefault("translation", "")
        parsed.setdefault("difficulty", profile.level)
        parsed.setdefault("focus_points", [])
        parsed.setdefault("expected_pronunciation_challenges", [])
        parsed.setdefault("short_explanation", "")
        return parsed

    def generate_scenario_dialogue(self, profile: LearningProfilePayload, scenario: str) -> dict[str, Any]:
        prompt = build_scenario_prompt(profile=profile, scenario=scenario)
        response = self.client.models.generate_content(
            model=AUDIO_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed.setdefault("title", scenario)
        parsed.setdefault("context", "")
        parsed.setdefault("dialogue", [])
        parsed.setdefault("pronunciation_focus", [])
        parsed.setdefault("practice_line_indices", [0])
        parsed.setdefault("coach_note", "")
        return parsed

    def generate_audio_feedback(
        self,
        text: str,
        voice_name: str,
        style: str,
        profile: LearningProfilePayload | None = None,
    ) -> dict[str, Any]:
        return self.generate_tts(
            text=text,
            voice_name=voice_name,
            style=style,
            profile=profile,
            learning_mode="Friendly tutor",
            generation_type="explanation_audio",
        )

    def analyze_translation(self, payload: TranslationAnalyzeRequest) -> dict[str, Any]:
        prompt = build_translation_prompt(
            text=payload.text,
            native_language=payload.native_language,
            target_language=payload.target_language,
            word_by_word=payload.options.word_by_word,
            vocabulary=payload.options.vocabulary,
            explanations=payload.options.explanations,
        )
        response = self._generate_with_retries(
            model=AUDIO_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        parsed = self._parse_json_response(response.text)
        parsed.setdefault("translation", "")
        parsed.setdefault("word_by_word", [])
        parsed.setdefault("vocabulary", [])
        parsed.setdefault("explanations", "")
        parsed["audio_translation_url"] = None

        if payload.mode in {"voice", "both"} and parsed.get("translation"):
            learning_mode_map = {
                "Normal speed": "Normal speed",
                "Slow reading": "Slow pronunciation",
                "Word-by-word playback": "Word-by-word",
                "Emphasized pronunciation": "Professional narrator",
            }
            tts_result = self.generate_tts(
                text=parsed["translation"],
                voice_name="Kore",
                style="Friendly",
                profile=LearningProfilePayload(
                    native_language=payload.native_language,
                    target_language=payload.target_language,
                    interface_language=payload.native_language,
                    preferred_voice_style="Friendly",
                ),
                learning_mode=learning_mode_map.get(
                    payload.options.learning_mode, "Normal speed"
                ),
                generation_type="model_pronunciation",
            )
            parsed["audio_translation_url"] = (
                f"data:{tts_result['mime_type']};base64,{tts_result['audio_base64']}"
            )

        return parsed

    def _generate_with_retries(
        self,
        model: str,
        contents: Any,
        config: types.GenerateContentConfig | None = None,
        attempts: int = 3,
    ) -> Any:
        last_error: APIError | None = None
        for attempt in range(1, attempts + 1):
            try:
                return self.client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
            except APIError as exc:
                last_error = exc
                status_code = getattr(exc, "status_code", None)
                if status_code not in {429, 500, 502, 503, 504} or attempt == attempts:
                    raise
                time.sleep(1.5 * attempt)
        if last_error:
            raise last_error
        raise RuntimeError("Gemini request failed without a captured API error.")

    def _generate_with_model_fallbacks(
        self,
        models: list[str],
        contents: Any,
        config: types.GenerateContentConfig | None = None,
    ) -> Any:
        last_error: APIError | None = None
        for index, model in enumerate(models):
            try:
                return self._generate_with_retries(
                    model=model,
                    contents=contents,
                    config=config,
                    attempts=3 if index == 0 else 2,
                )
            except APIError as exc:
                last_error = exc
                status_code = getattr(exc, "status_code", None)
                if status_code != 503 or index == len(models) - 1:
                    raise
        if last_error:
            raise last_error
        raise RuntimeError("Gemini fallback flow failed without a captured API error.")

    def _apply_expressive_tags(self, text: str) -> str:
        lowered = text.lower()
        tagged = text
        if "!" in text:
            tagged = f"[excited] {tagged}"
        if "?" in text and "?" == text.strip()[-1]:
            tagged = f"{tagged} [friendly curiosity]"
        if any(word in lowered for word in ("secret", "quiet", "whisper")):
            tagged = f"[whispers] {tagged}"
        if any(word in lowered for word in ("warning", "danger", "stop")):
            tagged = f"[shouting] {tagged}"
        return tagged

    def _parse_json_response(self, raw_text: str) -> dict[str, Any]:
        if not raw_text:
            return {}
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            if start >= 0 and end > start:
                return json.loads(raw_text[start : end + 1])
            raise

    def _build_overlay_tokens(self, target_text: str, parsed: dict[str, Any]) -> list[dict[str, str]]:
        correct = {str(item).lower() for item in parsed.get("correct_words", [])}
        missing = {str(item).lower() for item in parsed.get("missing_words", [])}
        wrong = {str(item).lower() for item in parsed.get("wrong_words", [])}
        tokens: list[dict[str, str]] = []
        for token in target_text.split():
            normalized = token.strip(".,!?;:").lower()
            status = "correct"
            if normalized in missing:
                status = "missing"
            elif normalized in wrong:
                status = "wrong"
            elif correct and normalized not in correct:
                status = "wrong"
            tokens.append({"token": token, "status": status})
        return tokens

    def _ensure_string_list(self, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if "\n" in stripped:
                return [item.strip("- ").strip() for item in stripped.splitlines() if item.strip()]
            return [stripped]
        return [str(value).strip()] if str(value).strip() else []

    def _ensure_object_list(self, value: Any) -> list[dict[str, Any]]:
        if value is None:
            return []
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        return []
