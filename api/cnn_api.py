import cv2
from fastapi.responses import JSONResponse
from pathlib import Path
from io import BytesIO
import sys

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path("/home/tej/BlueSentinel-V2")
sys.path.insert(0, str(ROOT))

from ai.models.unet import UNet

CHECKPOINT = ROOT / "ai/training/bluesentinel_cnn_v1/bluesentinel_cnn_v1.pt"
DEVICE = torch.device("cpu")
TILE = 512
INPUT_SIZE = 256
STRIDE = 384
THRESHOLD = 0.50

app = FastAPI(title="BlueSentinel V2 AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = UNet(base_channels=16)

checkpoint = torch.load(CHECKPOINT, map_location=DEVICE)

if isinstance(checkpoint, dict):
    state = (
        checkpoint.get("model_state_dict")
        or checkpoint.get("state_dict")
        or checkpoint
    )
else:
    state = checkpoint

model.load_state_dict(state)
model.to(DEVICE)
model.eval()


def infer_tile(tile):
    h, w = tile.shape[-2:]

    padded = F.pad(
        tile,
        (
            0, max(0, TILE - w),
            0, max(0, TILE - h),
        ),
    )

    x = F.interpolate(
        padded,
        size=(INPUT_SIZE, INPUT_SIZE),
        mode="bilinear",
        align_corners=False,
    )

    with torch.no_grad():
        y = torch.sigmoid(model(x))

    y = F.interpolate(
        y,
        size=padded.shape[-2:],
        mode="bilinear",
        align_corners=False,
    )

    return y[:, :, :h, :w]


def tiled_inference(image):
    _, _, height, width = image.shape

    probability = torch.zeros((1, 1, height, width))
    counts = torch.zeros_like(probability)

    ys = list(range(0, max(1, height - TILE + 1), STRIDE))
    xs = list(range(0, max(1, width - TILE + 1), STRIDE))

    if not ys or ys[-1] + TILE < height:
        ys.append(max(0, height - TILE))

    if not xs or xs[-1] + TILE < width:
        xs.append(max(0, width - TILE))

    for y in ys:
        for x in xs:
            tile = image[:, :, y:min(y + TILE, height), x:min(x + TILE, width)]
            pred = infer_tile(tile)

            ph, pw = pred.shape[-2:]

            probability[:, :, y:y + ph, x:x + pw] += pred
            counts[:, :, y:y + ph, x:x + pw] += 1

    return probability / counts.clamp_min(1)


@app.get("/health")
def health():
    return {
        "status": "ready",
        "mode": "REAL CNN",
        "model": "BlueSentinel V2 U-Net",
        "checkpoint": str(CHECKPOINT),
        "epoch": checkpoint.get("epoch") if isinstance(checkpoint, dict) else None,
        "validation_dice": checkpoint.get("val_dice") if isinstance(checkpoint, dict) else None,
        "device": str(DEVICE),
        "threshold": THRESHOLD,
    }


@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    raw = await file.read()

    image = Image.open(BytesIO(raw)).convert("L")
    array = np.asarray(image, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(array)[None, None]

    probability = tiled_inference(tensor)

    # CNN probability threshold
    mask = probability >= THRESHOLD

    # ------------------------------------------------------------
    # Clean segmentation using connected components
    # ------------------------------------------------------------
    raw_mask = mask[0, 0].numpy().astype(np.uint8)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        raw_mask,
        connectivity=8
    )

    MIN_REGION_AREA = 100
    clean_mask = np.zeros_like(raw_mask)

    detections = []

    for i in range(1, num_labels):
        area = int(stats[i, cv2.CC_STAT_AREA])

        if area < MIN_REGION_AREA:
            continue

        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        w = int(stats[i, cv2.CC_STAT_WIDTH])
        h = int(stats[i, cv2.CC_STAT_HEIGHT])

        region = labels == i
        confidence = float(probability[0, 0].numpy()[region].mean())

        clean_mask[region] = 255

        detections.append({
            "id": len(detections) + 1,
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "area_pixels": area,
            "confidence": round(confidence * 100, 2)
        })

    # ------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------
    foreground_pixels = int((clean_mask > 0).sum())
    total_pixels = int(clean_mask.size)
    max_confidence = float(probability.max().item())

    # ------------------------------------------------------------
    # Output images
    # ------------------------------------------------------------
    probability_image = (
        probability[0, 0].clamp(0, 1).numpy() * 255
    ).astype(np.uint8)

    mask_image = clean_mask

    original_rgb = np.asarray(image.convert("RGB")).copy()
    overlay = original_rgb.copy()

    predicted = clean_mask > 0

    overlay[predicted, 0] = 255
    overlay[predicted, 1] = (
        overlay[predicted, 1] * 0.25
    ).astype(np.uint8)
    overlay[predicted, 2] = (
        overlay[predicted, 2] * 0.25
    ).astype(np.uint8)

    # Draw bounding boxes around detected regions
    for d in detections:
        x, y = d["x"], d["y"]
        w, h = d["width"], d["height"]

        cv2.rectangle(
            overlay,
            (x, y),
            (x + w, y + h),
            (255, 255, 255),
            3
        )

    import base64

    def encode_png(arr, mode):
        buffer = BytesIO()
        Image.fromarray(arr, mode=mode).save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "mode": "REAL CNN",
        "model": "BlueSentinel V2 U-Net",
        "image": {
            "width": image.width,
            "height": image.height,
        },
        "summary": {
            "foreground_pixels": foreground_pixels,
            "foreground_percent": (
                foreground_pixels / total_pixels * 100
            ),
            "max_confidence": max_confidence * 100,
            "detected_regions": len(detections),
        },
        "threshold": THRESHOLD,
        "outputs": {
            "probability_map": (
                "data:image/png;base64,"
                + encode_png(probability_image, "L")
            ),
            "mask": (
                "data:image/png;base64,"
                + encode_png(mask_image, "L")
            ),
            "overlay": (
                "data:image/png;base64,"
                + encode_png(overlay, "RGB")
            ),
        },
        "detections": detections,
        "note": (
            "REAL CNN RESULT. The segmentation mask is generated "
            "directly by the BlueSentinel V2 U-Net. Small isolated "
            "regions are filtered using connected-component analysis. "
            "The current model performs binary shipwreck segmentation "
            "using the AI4Shipwrecks-trained U-Net."
        ),
    }
