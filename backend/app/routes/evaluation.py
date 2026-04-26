import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from evaluate_dataset import run_evaluation


router = APIRouter(tags=["evaluation"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]
EVALUATION_RESULTS_PATH = BACKEND_ROOT / "evaluation_results.json"
DEFAULT_METADATA_PATH = PROJECT_ROOT / "data" / "stt" / "metadata.csv"


class EvaluationRunRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=20)


@router.get("/evaluation/results")
async def get_evaluation_results() -> dict[str, Any]:
    if not EVALUATION_RESULTS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="evaluation_results.json was not found. Run the dataset evaluation script first.",
        )

    return json.loads(EVALUATION_RESULTS_PATH.read_text(encoding="utf-8"))


@router.post("/evaluation/run")
async def run_evaluation_results(
    payload: EvaluationRunRequest,
    x_gemini_api_key: str | None = Header(default=None, alias="X-Gemini-API-Key"),
) -> dict[str, Any]:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header.")
    if not DEFAULT_METADATA_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"metadata.csv was not found at {DEFAULT_METADATA_PATH}.",
        )

    try:
        return run_evaluation(
            metadata_path=DEFAULT_METADATA_PATH,
            output_path=EVALUATION_RESULTS_PATH,
            api_key=x_gemini_api_key,
            limit=payload.limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
