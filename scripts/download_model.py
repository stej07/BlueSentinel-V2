import os
from pathlib import Path
from huggingface_hub import hf_hub_download

REPO_ID = os.getenv("MODEL_REPO_ID", "stej07/bluesentinel-multiclass-unet")
FILENAME = os.getenv("MODEL_FILENAME", "best_multiclass_unet.pt")

target = Path("ai/training/bluesentinel_multiclass_v1") / FILENAME
target.parent.mkdir(parents=True, exist_ok=True)

if target.exists():
    print(f"Model already exists: {target}")
else:
    path = hf_hub_download(
        repo_id=REPO_ID,
        filename=FILENAME,
        local_dir=str(target.parent),
    )
    print(f"Model downloaded: {path}")
