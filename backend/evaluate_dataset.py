import argparse
import csv
import json
import os
import re
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter
from typing import Any

from app.schemas import LearningProfilePayload
from app.services.gemini_service import GeminiService
from app.utils.audio_processing import normalize_audio_mime_type


VALID_LEVELS = {"Beginner", "Intermediate", "Advanced"}
COLUMN_ALIASES = {
    "audio_file": ("audio_file", "filename", "file", "audio"),
    "ground_truth_text": ("ground_truth_text", "ground_truth", "transcript", "text"),
    "language": ("language", "lang"),
    "expected_level": ("expected_level", "level"),
}


def normalize_level(raw_level: str | None) -> str:
    value = (raw_level or "").strip().capitalize()
    if value in VALID_LEVELS:
        return value
    return "Intermediate"


def tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", (text or "").lower())


def compute_wer(reference: str, hypothesis: str) -> float:
    ref_words = tokenize(reference)
    hyp_words = tokenize(hypothesis)
    if not ref_words:
        return 0.0 if not hyp_words else 1.0

    rows = len(ref_words) + 1
    cols = len(hyp_words) + 1
    dp = [[0] * cols for _ in range(rows)]

    for i in range(rows):
        dp[i][0] = i
    for j in range(cols):
        dp[0][j] = j

    for i in range(1, rows):
        for j in range(1, cols):
            substitution_cost = 0 if ref_words[i - 1] == hyp_words[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + substitution_cost,
            )

    return dp[-1][-1] / len(ref_words)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate a LinguistAI dataset against Gemini STT and pronunciation analysis.",
    )
    parser.add_argument("--metadata", default="metadata.csv", help="Path to metadata.csv.")
    parser.add_argument("--output", default="evaluation_results.json", help="Output JSON path.")
    parser.add_argument(
        "--api-key",
        default=os.getenv("GEMINI_API_KEY", ""),
        help="Gemini API key. Falls back to GEMINI_API_KEY.",
    )
    parser.add_argument(
        "--native-language",
        default="English",
        help="Native/interface language for the evaluation prompts.",
    )
    return parser.parse_args()


def build_profile(language: str, expected_level: str, native_language: str) -> LearningProfilePayload:
    target_language = (language or "").strip() or "English"
    return LearningProfilePayload(
        native_language=native_language,
        target_language=target_language,
        interface_language=native_language,
        level=normalize_level(expected_level),
        learning_goal="Benchmark Evaluation",
        feedback_style="Detailed",
        preferred_voice_style="Professional",
        weak_points=[],
    )


def resolve_audio_path(metadata_path: Path, audio_file: str) -> Path:
    candidate = Path(audio_file)
    if candidate.is_absolute():
        return candidate
    direct_candidate = (metadata_path.parent / candidate).resolve()
    if direct_candidate.exists():
        return direct_candidate

    audio_subdir_candidate = (metadata_path.parent / "audio" / candidate.name).resolve()
    if audio_subdir_candidate.exists():
        return audio_subdir_candidate

    return direct_candidate


def get_row_value(row: dict[str, str], canonical_name: str, default: str = "") -> str:
    for alias in COLUMN_ALIASES[canonical_name]:
        value = row.get(alias)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default


def missing_canonical_columns(fieldnames: list[str] | None) -> list[str]:
    available = set(fieldnames or [])
    missing: list[str] = []
    for canonical_name, aliases in COLUMN_ALIASES.items():
        if canonical_name == "expected_level":
            continue
        if not any(alias in available for alias in aliases):
            missing.append(canonical_name)
    return missing


def evaluate_row(
    service: GeminiService,
    metadata_path: Path,
    row: dict[str, str],
    native_language: str,
) -> dict[str, Any]:
    audio_file = get_row_value(row, "audio_file")
    audio_path = resolve_audio_path(metadata_path, audio_file)
    mime_type = normalize_audio_mime_type(None, audio_path.name)
    profile = build_profile(
        language=get_row_value(row, "language"),
        expected_level=get_row_value(row, "expected_level", "Intermediate"),
        native_language=native_language,
    )

    stt_start = perf_counter()
    stt_result = service.transcribe_and_analyze_audio(audio_path, mime_type, profile)
    stt_latency_seconds = round(perf_counter() - stt_start, 3)

    pronunciation_start = perf_counter()
    pronunciation_result = service.analyze_pronunciation(
        target_text=get_row_value(row, "ground_truth_text"),
        audio_path=audio_path,
        mime_type=mime_type,
        profile=profile,
    )
    pronunciation_latency_seconds = round(perf_counter() - pronunciation_start, 3)

    transcript = str(stt_result.get("transcript", "") or "")
    ground_truth_text = get_row_value(row, "ground_truth_text")
    wer = round(compute_wer(ground_truth_text, transcript), 4)
    accuracy = round(1 - wer, 4)
    pronunciation_score = int(pronunciation_result.get("score", 0) or 0)
    stt_confidence = int(stt_result.get("confidence", 0) or 0)
    model_used = str(stt_result.get("_model_used") or pronunciation_result.get("_model_used") or "")

    return {
        "audio_file": audio_file,
        "language": get_row_value(row, "language"),
        "expected_level": normalize_level(get_row_value(row, "expected_level", "Intermediate")),
        "ground_truth_text": ground_truth_text,
        "gemini_transcript": transcript,
        "summary": stt_result.get("summary", ""),
        "wer": wer,
        "accuracy": accuracy,
        "latency_seconds": stt_latency_seconds,
        "pronunciation_latency_seconds": pronunciation_latency_seconds,
        "total_processing_seconds": round(stt_latency_seconds + pronunciation_latency_seconds, 3),
        "stt_confidence": stt_confidence,
        "pronunciation_score": pronunciation_score,
        "model": model_used,
        "model_display": service.get_model_display_name(model_used),
    }


def summarize_results(items: list[dict[str, Any]]) -> dict[str, Any]:
    if not items:
        return {
            "sample_count": 0,
            "average_wer": 0.0,
            "average_accuracy": 0.0,
            "average_latency_seconds": 0.0,
            "average_pronunciation_score": 0.0,
        }

    count = len(items)
    return {
        "sample_count": count,
        "average_wer": round(sum(item["wer"] for item in items) / count, 4),
        "average_accuracy": round(sum(item["accuracy"] for item in items) / count, 4),
        "average_latency_seconds": round(sum(item["latency_seconds"] for item in items) / count, 3),
        "average_pronunciation_score": round(sum(item["pronunciation_score"] for item in items) / count, 2),
    }


def aggregate_by_language(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        buckets[item["language"] or "Unknown"].append(item)

    rows: list[dict[str, Any]] = []
    for language, values in sorted(buckets.items(), key=lambda pair: pair[0].lower()):
        count = len(values)
        rows.append(
            {
                "language": language,
                "sample_count": count,
                "average_latency_seconds": round(sum(item["latency_seconds"] for item in values) / count, 3),
                "average_accuracy": round(sum(item["accuracy"] for item in values) / count, 4),
                "average_pronunciation_score": round(sum(item["pronunciation_score"] for item in values) / count, 2),
            }
        )
    return rows


def run_evaluation(
    metadata_path: Path,
    output_path: Path,
    api_key: str,
    native_language: str = "English",
    limit: int | None = None,
) -> dict[str, Any]:
    service = GeminiService(api_key=api_key)
    items: list[dict[str, Any]] = []

    with metadata_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        missing_columns = missing_canonical_columns(reader.fieldnames)
        if missing_columns:
            raise ValueError(
                f"metadata.csv is missing required columns: {', '.join(sorted(missing_columns))}"
            )

        for index, row in enumerate(reader, start=1):
            if limit is not None and len(items) >= limit:
                break
            try:
                item = evaluate_row(service, metadata_path, row, native_language)
                item["row_index"] = index
                items.append(item)
                print(
                    f"[{index}] {item['audio_file']} | WER={item['wer']:.4f} | "
                    f"Latency={item['latency_seconds']:.3f}s | Score={item['pronunciation_score']}",
                    flush=True,
                )
            except Exception as exc:  # noqa: BLE001
                items.append(
                    {
                        "row_index": index,
                        "audio_file": get_row_value(row, "audio_file"),
                        "language": get_row_value(row, "language"),
                        "expected_level": normalize_level(get_row_value(row, "expected_level", "Intermediate")),
                        "ground_truth_text": get_row_value(row, "ground_truth_text"),
                        "error": str(exc),
                    }
                )
                print(
                    f"[{index}] Failed for {get_row_value(row, 'audio_file')}: {exc}",
                    file=sys.stderr,
                    flush=True,
                )

    successful_items = [item for item in items if "error" not in item]
    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source_metadata_csv": str(metadata_path),
        "summary": summarize_results(successful_items),
        "by_language": aggregate_by_language(successful_items),
        "items": items,
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return payload


def main() -> int:
    args = parse_args()
    if not args.api_key:
        print("Missing Gemini API key. Use --api-key or set GEMINI_API_KEY.", file=sys.stderr)
        return 1

    metadata_path = Path(args.metadata).resolve()
    output_path = Path(args.output).resolve()
    if not metadata_path.exists():
        print(f"metadata.csv not found: {metadata_path}", file=sys.stderr)
        return 1

    try:
        payload = run_evaluation(
            metadata_path=metadata_path,
            output_path=output_path,
            api_key=args.api_key,
            native_language=args.native_language,
            limit=None,
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(f"Saved evaluation results to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
