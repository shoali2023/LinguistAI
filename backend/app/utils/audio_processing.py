import io
import os
import uuid
import wave
from pathlib import Path

from fastapi import UploadFile


TEMP_DIR = Path(__file__).resolve().parents[2] / "temp_audio"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/mp3": ".mp3",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/ogg;codecs=opus": ".ogg",
    "audio/webm": ".webm",
    "audio/webm;codecs=opus": ".webm",
    "audio/aiff": ".aiff",
    "audio/aac": ".aac",
    "audio/flac": ".flac",
}


async def persist_upload_file(upload_file: UploadFile) -> Path:
    suffix = Path(upload_file.filename or "audio.wav").suffix or ".wav"
    destination = TEMP_DIR / f"{uuid.uuid4().hex}{suffix}"

    with destination.open("wb") as buffer:
        while True:
            chunk = await upload_file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)

    await upload_file.close()
    return destination


def cleanup_file(path: Path) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        return


def normalize_audio_mime_type(mime_type: str | None, filename: str | None = None) -> str:
    normalized_mime_type = (mime_type or "").split(";")[0].strip().lower()
    if mime_type in SUPPORTED_AUDIO_MIME_TYPES:
        return mime_type
    if normalized_mime_type in SUPPORTED_AUDIO_MIME_TYPES:
        return normalized_mime_type

    suffix = Path(filename or "").suffix.lower()
    if suffix == ".wav":
        return "audio/wav"
    if suffix == ".mp3":
        return "audio/mp3"
    if suffix == ".ogg":
        return "audio/ogg"
    if suffix == ".webm":
        return "audio/webm"
    if suffix in {".aiff", ".aif"}:
        return "audio/aiff"
    if suffix == ".aac":
        return "audio/aac"
    if suffix == ".flac":
        return "audio/flac"

    raise ValueError(
        "Unsupported audio format. Please upload WAV, MP3, OGG, WEBM, AAC, AIFF, or FLAC."
    )


def pcm_to_wav_bytes(
    pcm_bytes: bytes,
    channels: int = 1,
    sample_rate: int = 24000,
    sample_width: int = 2,
) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return buffer.getvalue()
