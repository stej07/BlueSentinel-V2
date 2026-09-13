import os
from pathlib import Path
from huggingface_hub import hf_hub_download

REPO_ID = os.getenv("MODEL_REPO_ID", "stej07/bluesentinel-multiclass-unet")

MODELS = [
    (
        "best_multiclass_unet.pt",
        Path("ai/training/bluesentinel_multiclass_v1/best_multiclass_unet.pt"),
    ),
    (
        "ghost_mine_specialist.pt",
        Path("ai/training/ghost_mine_fresh/best_ghost_mine.pt"),
    ),
]

for filename, target in MODELS:
    target.parent.mkdir(parents=True, exist_ok=True)

    if target.exists():
        print(f"Model already exists: {target}", flush=True)
        continue

    path = hf_hub_download(
        repo_id=REPO_ID,
        filename=filename,
        local_dir=str(target.parent),
        local_dir_use_symlinks=False,
    )

    downloaded = Path(path)

    if downloaded != target:
        downloaded.replace(target)

    print(f"Model downloaded: {target}", flush=True)
