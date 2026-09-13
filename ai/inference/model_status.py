import os
import torch

CHECKPOINT = "ai/training/bluesentinel_multiclass_v1/best_multiclass_unet.pt"

def get_model_status():
    exists = os.path.exists(CHECKPOINT)

    return {
        "model": "BlueSentinel Multi-Class U-Net",
        "classes": 4,
        "background_class": True,
        "checkpoint_available": exists,
        "checkpoint": CHECKPOINT,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "status": "ready" if exists else "training",
    }

if __name__ == "__main__":
    status = get_model_status()

    for key, value in status.items():
        print(f"{key}: {value}")
