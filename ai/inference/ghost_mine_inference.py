import cv2
import torch
import numpy as np
from pathlib import Path
from ai.models.multiclass_unet import MultiClassUNet

CLASS_NAMES = {
    0: "Background",
    1: "Ghost Net",
    2: "Mine / Cylinder",
}

class GhostMineInference:
    def __init__(self, checkpoint):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = MultiClassUNet(
            in_channels=1,
            num_classes=3,
            base_channels=8,
        ).to(self.device)

        checkpoint = Path(checkpoint)
        data = torch.load(checkpoint, map_location=self.device)
        self.model.load_state_dict(data["model"])
        self.model.eval()

    def predict(self, image_path):
        image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise ValueError("Unable to read image.")

        original_h, original_w = image.shape

        resized = cv2.resize(
            image,
            (256, 256),
            interpolation=cv2.INTER_LINEAR,
        )

        tensor = torch.from_numpy(resized).float().unsqueeze(0).unsqueeze(0) / 255.0
        tensor = (tensor - 0.5) / 0.5
        tensor = tensor.to(self.device)

        with torch.no_grad():
            probabilities = torch.softmax(self.model(tensor), dim=1)[0]
            prediction = probabilities.argmax(dim=0)
            confidence_map = probabilities.max(dim=0).values

        detections = []

        for class_id in (1, 2):
            mask = prediction == class_id
            pixel_count = int(mask.sum().item())

            if pixel_count < 50:
                continue

            confidence = float(confidence_map[mask].mean().item())

            if confidence < 0.50:
                continue

            ys, xs = torch.where(mask)

            detections.append({
                "class_id": class_id,
                "class_name": CLASS_NAMES[class_id],
                "confidence": confidence,
                "pixel_count": pixel_count,
                "bbox": {
                    "x": int(xs.min().item()),
                    "y": int(ys.min().item()),
                    "width": int(xs.max().item() - xs.min().item() + 1),
                    "height": int(ys.max().item() - ys.min().item() + 1),
                },
                "model_source": "Ghost/Mine Specialist U-Net",
            })

        return {
            "image_size": {
                "width": original_w,
                "height": original_h,
            },
            "input_size": 256,
            "detections": detections,
        }
