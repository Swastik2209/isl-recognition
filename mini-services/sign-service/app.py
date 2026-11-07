"""
AccessBridge sign service.

Serves the PRETRAINED 1st-place Google - Isolated Sign Language
Recognition model (model.tflite, MIT licence) over a small HTTP API.

Model contract (verified empirically with LiteRT):
  input : float32 (T, 543, 3)  - T frames of MediaPipe Holistic landmarks
                                  ordered [face 468, left hand 21, pose 33,
                                  right hand 21], values in [0, 1] image
                                  coordinates (x, y) and relative depth (z)
  output: 250 raw scores, one per class in sign_to_prediction_index_map.json

The model is loaded ONCE at startup. Requests never carry video - only
compact landmark arrays. All inference is local to this machine.
"""

from __future__ import annotations

import json
import math
import os
import threading
import time

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from ai_edge_litert.interpreter import Interpreter
except ImportError:  # pragma: no cover
    from tflite_runtime.interpreter import Interpreter  # type: ignore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "sign_to_prediction_index_map.json")

LANDMARKS_PER_FRAME = 543
VALUES_PER_LANDMARK = 3
# Honest, measured default: below this the service refuses to guess.
CONFIDENCE_THRESHOLD = 0.30
MODEL_VERSION = "gislr-1st-place-tflite"

app = FastAPI(title="AccessBridge Sign Service", version="1.0.0")

interpreter: Interpreter | None = None
labels: dict[str, int] = {}
inv_labels: dict[int, str] = {}
lock = threading.Lock()


class PredictRequest(BaseModel):
    """Landmark window: flattened T*543*3 floats, row-major."""

    landmarks: list[float] = Field(..., description="Flattened landmark values")
    frames: int = Field(..., gt=0, le=600, description="Number of frames")


class Alternative(BaseModel):
    word: str
    confidence: float


class OkResponse(BaseModel):
    status: str = "ok"
    word: str
    confidence: float
    margin: float
    alternatives: list[Alternative]
    latencyMs: int


class NoMatchResponse(BaseModel):
    status: str = "no_match"
    message: str
    alternatives: list[Alternative]
    latencyMs: int


class NoHandResponse(BaseModel):
    status: str = "no_hand"
    message: str
    latencyMs: int


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str


def load_model() -> None:
    global interpreter, labels, inv_labels
    if interpreter is not None:
        return
    with lock:
        if interpreter is not None:
            return
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model file missing: {MODEL_PATH}")
        with open(LABELS_PATH, encoding="utf-8") as fh:
            labels = json.load(fh)
        inv_labels = {v: k for k, v in labels.items()}
        interp = Interpreter(model_path=MODEL_PATH, num_threads=2)
        interp.allocate_tensors()
        interpreter = interp


@app.on_event("startup")
def startup() -> None:
    load_model()


def softmax(scores: np.ndarray) -> np.ndarray:
    e = np.exp(scores - scores.max())
    return e / e.sum()


def is_all_zero(window: np.ndarray) -> bool:
    return not np.any(window)


@app.get("/health")
@app.get("/api/sign/health")
def health() -> dict:
    """Liveness + model info."""
    try:
        load_model()
        return {
            "status": "ok",
            "model": MODEL_VERSION,
            "n_classes": len(labels),
            "license": "MIT",
            "source": "https://huggingface.co/sign/kaggle-asl-signs-1st-place",
            "confidence_threshold": CONFIDENCE_THRESHOLD,
        }
    except Exception as exc:  # pragma: no cover
        return {"status": "error", "message": str(exc)}


@app.post("/predict", response_model=None)
@app.post("/api/sign/predict", response_model=None)
def predict(req: PredictRequest) -> dict:
    started = time.perf_counter()
    try:
        load_model()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}") from exc

    expected = req.frames * LANDMARKS_PER_FRAME * VALUES_PER_LANDMARK
    if len(req.landmarks) != expected:
        return ErrorResponse(
            status="error",
            message=f"Expected {expected} values for {req.frames} frames, got {len(req.landmarks)}",
        ).model_dump()

    window = np.asarray(req.landmarks, dtype=np.float32).reshape(req.frames, LANDMARKS_PER_FRAME, VALUES_PER_LANDMARK)

    if is_all_zero(window):
        return NoHandResponse(
            message="No landmarks were detected in the capture window.",
            latencyMs=int((time.perf_counter() - started) * 1000),
        ).model_dump()

    interp = interpreter
    assert interp is not None
    input_details = interp.get_input_details()
    output_details = interp.get_output_details()
    interp.resize_tensor_input(input_details[0]["index"], (req.frames, LANDMARKS_PER_FRAME, VALUES_PER_LANDMARK))
    interp.allocate_tensors()
    interp.set_tensor(input_details[0]["index"], window)
    with lock:
        interp.invoke()
    scores = interp.get_tensor(output_details[0]["index"]).flatten()
    probs = softmax(scores)

    top = probs.argsort()[::-1]
    best = int(top[0])
    best_word = inv_labels.get(best, f"class_{best}")
    best_prob = float(probs[best])
    latency = int((time.perf_counter() - started) * 1000)

    alts = [Alternative(word=inv_labels.get(int(i), f"class_{int(i)}"), confidence=float(probs[int(i)])) for i in top[1:4]]

    if best_prob < CONFIDENCE_THRESHOLD:
        return NoMatchResponse(
            message="No confident match. Please try the sign again.",
            alternatives=alts,
            latencyMs=latency,
        ).model_dump()

    margin = float(best_prob - probs[top[1]]) if len(top) > 1 else best_prob
    return OkResponse(
        word=best_word,
        confidence=round(best_prob, 4),
        margin=round(margin, 4),
        alternatives=alts,
        latencyMs=latency,
    ).model_dump()


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=3031, log_level="warning")
