import sys
import os
import json
import cv2
from ultralytics import YOLO

from ai.yolo.preprocessing.sonar_preprocess import preprocess_sonar

MODEL_PATH = "ai/yolo/models/best_detector.pt"
CONFIDENCE = 0.25
IOU = 0.45
IMG_SIZE = 640

if len(sys.argv) != 2:
    print("Usage:")
    print("PYTHONPATH=. python ai/yolo/inference/test_detector.py <image>")
    sys.exit(1)

image_path = sys.argv[1]

if not os.path.isfile(image_path):
    raise FileNotFoundError(f"Image not found: {image_path}")

image = cv2.imread(image_path)

if image is None:
    raise ValueError(f"Could not read image: {image_path}")

print("Input:", image_path)
print("Original shape:", image.shape)

processed = preprocess_sonar(image)

print("Preprocessed shape:", processed.shape)

model = YOLO(MODEL_PATH)

results = model.predict(
    source=processed,
    imgsz=IMG_SIZE,
    conf=CONFIDENCE,
    iou=IOU,
    device="cpu",
    max_det=50,
    verbose=False
)

os.makedirs("ai/yolo/runs", exist_ok=True)

detections = []

for result in results:

    if result.boxes is None or len(result.boxes) == 0:
        continue

    for box in result.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])

        xyxy = [
            round(float(x), 2)
            for x in box.xyxy[0]
        ]

        detections.append({
            "class_id": cls,
            "class_name": model.names[cls],
            "confidence": round(conf, 4),
            "bbox": xyxy
        })

# Sort highest confidence first
detections.sort(
    key=lambda x: x["confidence"],
    reverse=True
)

# Create annotated output using YOLO's built-in plotting
annotated = image.copy()

for detection in detections:
    x1, y1, x2, y2 = map(int, detection["bbox"])

    label = (
        f"{detection['class_name']} "
        f"{detection['confidence'] * 100:.1f}%"
    )

    cv2.rectangle(
        annotated,
        (x1, y1),
        (x2, y2),
        (0, 0, 255),
        3
    )

    cv2.putText(
        annotated,
        label,
        (x1, max(25, y1 - 8)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 255),
        2,
        cv2.LINE_AA
    )

input_name = os.path.splitext(
    os.path.basename(image_path)
)[0]

output_image = (
    f"ai/yolo/runs/{input_name}_marine_detection.png"
)

output_json = (
    f"ai/yolo/runs/{input_name}_marine_detection.json"
)

cv2.imwrite(output_image, annotated)

report = {
    "project": "BlueSentinel V2",
    "model": "DRISHTI marine sonar YOLOv8s",
    "model_file": MODEL_PATH,
    "input_image": image_path,
    "inference_device": "CPU",
    "preprocessing": [
        "Lee speckle filter",
        "CLAHE"
    ],
    "confidence_threshold": CONFIDENCE,
    "iou_threshold": IOU,
    "image_size": IMG_SIZE,
    "total_detections": len(detections),
    "detections": detections
}

with open(output_json, "w") as f:
    json.dump(report, f, indent=2)

print()
print("=== BLUESENTINEL MARINE AI ===")
print("Model: DRISHTI YOLOv8s")
print("Device: CPU")
print("Preprocessing: Lee filter + CLAHE")
print(f"Confidence threshold: {CONFIDENCE}")
print(f"NMS IoU threshold: {IOU}")
print()
print(f"Total detections: {len(detections)}")

for i, detection in enumerate(detections, 1):
    print(
        f"{i}. "
        f"{detection['class_name']} | "
        f"Confidence: {detection['confidence'] * 100:.1f}% | "
        f"Box: {detection['bbox']}"
    )

print()
print("=== OUTPUT FILES ===")
print("Annotated image:", output_image)
print("JSON report:", output_json)
