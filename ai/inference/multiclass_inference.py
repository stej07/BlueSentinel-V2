import os
import torch
import numpy as np
from PIL import Image
from ai.models.multiclass_unet import MultiClassUNet

CLASS_NAMES = {
    0: "Background",
    1: "Submarine Pipeline",
    2: "Shipwreck",
    3: "Ghost Net",
    4: "Mine / Cylinder",
}

IMAGE_SIZE = 256
BASE_CHANNELS = 8

CHECKPOINT = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "training",
    "bluesentinel_multiclass_v1",
    "best_multiclass_unet.pt",
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class MarineAnomalyInference:
    def __init__(self, checkpoint=CHECKPOINT):
        if not os.path.isfile(checkpoint):
            raise FileNotFoundError(f"Checkpoint not found: {checkpoint}")

        self.model = MultiClassUNet(
            in_channels=1,
            num_classes=5,
            base_channels=BASE_CHANNELS,
        )

        data = torch.load(
            checkpoint,
            map_location=DEVICE,
            weights_only=False,
        )

        if isinstance(data, dict) and "model" in data:
            state_dict = data["model"]
        elif isinstance(data, dict) and "model_state_dict" in data:
            state_dict = data["model_state_dict"]
        elif isinstance(data, dict) and "state_dict" in data:
            state_dict = data["state_dict"]
        else:
            state_dict = data

        self.model.load_state_dict(state_dict)
        self.model.to(DEVICE)
        self.model.eval()

    def preprocess(self, image_path):
        image = Image.open(image_path).convert("L")
        original_size = image.size

        image = image.resize(
            (IMAGE_SIZE, IMAGE_SIZE),
            Image.Resampling.BILINEAR,
        )

        array = np.asarray(image, dtype=np.float32) / 255.0
        array = (array - 0.5) / 0.5

        tensor = torch.from_numpy(array).unsqueeze(0).unsqueeze(0)

        return tensor.to(DEVICE), original_size

    @torch.no_grad()
    def predict(self, image_path):
        tensor, original_size = self.preprocess(image_path)

        logits = self.model(tensor)
        probabilities = torch.softmax(logits, dim=1)

        prediction = torch.argmax(
            probabilities,
            dim=1,
        )[0]

        confidence = torch.max(
            probabilities,
            dim=1,
        )[0][0]

        prediction_np = prediction.cpu().numpy()
        confidence_np = confidence.cpu().numpy()

        detections = []

        for class_id in range(1, 5):
            mask = prediction_np == class_id

            if not np.any(mask):
                continue

            ys, xs = np.where(mask)

            detections.append({
                "class_id": class_id,
                "class_name": CLASS_NAMES[class_id],
                "confidence": float(confidence_np[mask].mean()),
                "pixel_count": int(mask.sum()),
                "bbox": {
                    "x": int(xs.min()),
                    "y": int(ys.min()),
                    "width": int(xs.max() - xs.min() + 1),
                    "height": int(ys.max() - ys.min() + 1),
                },
            })

        return {
            "image": os.path.basename(image_path),
            "device": str(DEVICE),
            "image_size": {
                "width": original_size[0],
                "height": original_size[1],
            },
            "input_size": IMAGE_SIZE,
            "detections": detections,
            "prediction_mask": prediction_np,
            "confidence_map": confidence_np,
        }
