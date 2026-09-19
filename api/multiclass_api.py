from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import tempfile
import gc
import torch

from ai.inference.multiclass_inference import MarineAnomalyInference
from ai.inference.ghost_mine_inference import GhostMineInference

torch.set_num_threads(1)

app = FastAPI(
    title="BlueSentinel Multi-Class AI API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHECKPOINT = "ai/training/bluesentinel_multiclass_v1/best_multiclass_unet.pt"
SPECIALIST_CHECKPOINT = "ai/training/ghost_mine_fresh/best_ghost_mine.pt"

_engine = None


def get_engine():
    global _engine

    if _engine is None:
        if not os.path.exists(CHECKPOINT):
            raise HTTPException(
                status_code=503,
                detail="Multi-class model checkpoint is not available yet.",
            )
        _engine = MarineAnomalyInference(CHECKPOINT)

    return _engine


@app.get("/")
def root():
    return {
        "service": "BlueSentinel Multi-Class AI API",
        "status": "online",
        "model_checkpoint_available": os.path.exists(CHECKPOINT),
        "specialist_checkpoint_available": os.path.exists(SPECIALIST_CHECKPOINT),
    }


@app.get("/health")
def health():
    available = os.path.exists(CHECKPOINT)
    specialist_available = os.path.exists(SPECIALIST_CHECKPOINT)

    return {
        "status": "ready" if available and specialist_available else "training",
        "model": "BlueSentinel Multi-Class U-Net",
        "classes": [
            "Submarine Pipeline",
            "Shipwreck",
            "Ghost Net",
            "Mine / Cylinder",
        ],
        "checkpoint": CHECKPOINT,
        "checkpoint_available": available,
        "specialist_model": "Ghost/Mine Specialist U-Net",
        "specialist_checkpoint": SPECIALIST_CHECKPOINT,
        "specialist_checkpoint_available": specialist_available,
        "inference_mode": "main model with memory-safe Ghost/Mine fallback",
    }


@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    if not os.path.exists(CHECKPOINT):
        raise HTTPException(
            status_code=503,
            detail="Main model checkpoint is not available.",
        )

    if not os.path.exists(SPECIALIST_CHECKPOINT):
        raise HTTPException(
            status_code=503,
            detail="Ghost/Mine specialist checkpoint is not available.",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image.",
        )

    data = await file.read()

    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file.",
        )

    suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        ) as temp:
            temp.write(data)
            temp_path = temp.name

        main_engine = get_engine()
        main_result = main_engine.predict(temp_path)

        primary_detections = [
            d for d in main_result["detections"]
            if d.get("class_id") in (1, 2)
        ]

        if primary_detections:
            detections = primary_detections
            model_used = "BlueSentinel Multi-Class U-Net"
            models_used = ["BlueSentinel Multi-Class U-Net"]
        else:
            specialist = GhostMineInference(SPECIALIST_CHECKPOINT)
            specialist_result = specialist.predict(temp_path)

            detections = specialist_result["detections"]
            model_used = "Ghost/Mine Specialist U-Net"
            models_used = [
                "BlueSentinel Multi-Class U-Net",
                "Ghost/Mine Specialist U-Net",
            ]

            del specialist
            gc.collect()

        return {
            "status": "success",
            "model": model_used,
            "classes": [
                "Submarine Pipeline",
                "Shipwreck",
                "Ghost Net",
                "Mine / Cylinder",
            ],
            "result": {
                "image": file.filename,
                "image_size": main_result["image_size"],
                "input_size": main_result["input_size"],
                "detections": detections,
                "models": models_used,
            },
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
