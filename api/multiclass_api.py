from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import tempfile

from ai.inference.multiclass_inference import MarineAnomalyInference

app = FastAPI(
    title="BlueSentinel Multi-Class AI API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHECKPOINT = "ai/training/bluesentinel_multiclass_v1/best_multiclass_unet.pt"

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
    }


@app.get("/health")
def health():
    available = os.path.exists(CHECKPOINT)

    return {
        "status": "ready" if available else "training",
        "model": "BlueSentinel Multi-Class U-Net",
        "classes": [
            "Submarine Pipeline",
            "Shipwreck",
            "Ghost Net",
            "Mine / Cylinder",
        ],
        "checkpoint": CHECKPOINT,
        "checkpoint_available": available,
    }


@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    if not os.path.exists(CHECKPOINT):
        raise HTTPException(
            status_code=503,
            detail="Model is still training. Inference is unavailable.",
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

        engine = get_engine()
        result = engine.predict(temp_path)

        return {
            "status": "success",
            "model": "BlueSentinel Multi-Class U-Net",
            "classes": [
                "Submarine Pipeline",
                "Shipwreck",
                "Ghost Net",
                "Mine / Cylinder",
            ],
            "result": {
                "image": file.filename,
                "image_size": result["image_size"],
                "input_size": result["input_size"],
                "detections": result["detections"],
            },
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
