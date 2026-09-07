from pathlib import Path
import csv
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from ai.models.unet import UNet


IMAGE_DIR = Path("data/raw/AI4Shipwrecks/train/images")
LABEL_DIR = Path("data/raw/AI4Shipwrecks/train/labels")
CHECKPOINT = Path("ai/training/checkpoints/best_unet.pt")

OUTPUT_DIR = Path("data/hard_negatives")

TILE_SIZE = 512
MODEL_SIZE = 256
STRIDE = 384

MIN_PROBABILITY = 0.90
MAX_PATCHES_PER_IMAGE = 4

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

if DEVICE.type == "cpu":
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)


def positions(length):
    if length <= TILE_SIZE:
        return [0]

    values = list(range(
        0,
        length - TILE_SIZE + 1,
        STRIDE
    ))

    last = length - TILE_SIZE

    if values[-1] != last:
        values.append(last)

    return values


def pad_pair(image, label):
    h, w = image.shape

    pad_h = max(0, TILE_SIZE - h)
    pad_w = max(0, TILE_SIZE - w)

    if pad_h == 0 and pad_w == 0:
        return image, label

    image = np.pad(
        image,
        ((0, pad_h), (0, pad_w)),
        mode="reflect"
    )

    label = np.pad(
        label,
        ((0, pad_h), (0, pad_w)),
        mode="constant",
        constant_values=0
    )

    return image, label


@torch.no_grad()
def predict_tile(model, tile):

    tensor = torch.from_numpy(
        tile.astype(np.float32) / 255.0
    )

    tensor = tensor.unsqueeze(0).unsqueeze(0)

    tensor = (tensor - 0.5) / 0.5

    tensor = F.interpolate(
        tensor,
        size=(MODEL_SIZE, MODEL_SIZE),
        mode="bilinear",
        align_corners=False
    )

    tensor = tensor.to(DEVICE)

    logits = model(tensor)

    probability = torch.sigmoid(logits)

    probability = F.interpolate(
        probability,
        size=(TILE_SIZE, TILE_SIZE),
        mode="bilinear",
        align_corners=False
    )

    return probability[0, 0].cpu().numpy()


print("BlueSentinel — Corrected Hard Negative Mining")
print("=" * 60)

checkpoint = torch.load(
    CHECKPOINT,
    map_location=DEVICE,
    weights_only=False
)

model = UNet(base_channels=16)
model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.to(DEVICE)
model.eval()

print(f"Device: {DEVICE}")
print(f"Checkpoint epoch: {checkpoint['epoch']}")
print(
    f"Validation Dice: "
    f"{checkpoint['val_dice']:.4f}"
)
print(f"Mining threshold: {MIN_PROBABILITY}")
print()

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

for old_file in OUTPUT_DIR.glob("*"):
    if old_file.is_file():
        old_file.unlink()

metadata_path = OUTPUT_DIR / "metadata.csv"

metadata_file = open(
    metadata_path,
    "w",
    newline=""
)

writer = csv.writer(metadata_file)

writer.writerow([
    "source_image",
    "x",
    "y",
    "max_probability",
    "mean_probability",
    "high_confidence_fraction",
    "ground_truth_positive_pixels"
])

total_images = 0
total_candidates = 0
total_selected = 0

for image_path in sorted(
    IMAGE_DIR.glob("*.png")
):

    label_path = LABEL_DIR / image_path.name

    if not label_path.exists():
        continue

    image = np.array(
        Image.open(image_path).convert("L")
    )

    label = np.array(
        Image.open(label_path).convert("L")
    )

    image, label = pad_pair(
        image,
        label
    )

    candidates = []

    for y in positions(image.shape[0]):

        for x in positions(image.shape[1]):

            image_tile = image[
                y:y + TILE_SIZE,
                x:x + TILE_SIZE
            ]

            label_tile = label[
                y:y + TILE_SIZE,
                x:x + TILE_SIZE
            ]

            # CRITICAL:
            # This tile must contain absolutely no
            # ground-truth shipwreck pixels.
            gt_positive = int(
                (label_tile > 0).sum()
            )

            if gt_positive != 0:
                continue

            probability = predict_tile(
                model,
                image_tile
            )

            high_fraction = float(
                (probability >= MIN_PROBABILITY).mean()
            )

            mean_probability = float(
                probability.mean()
            )

            max_probability = float(
                probability.max()
            )

            candidates.append({
                "image": image_tile.copy(),
                "x": x,
                "y": y,
                "max": max_probability,
                "mean": mean_probability,
                "fraction": high_fraction
            })

    total_candidates += len(candidates)

    candidates.sort(
        key=lambda item: (
            item["fraction"],
            item["mean"],
            item["max"]
        ),
        reverse=True
    )

    selected = candidates[
        :MAX_PATCHES_PER_IMAGE
    ]

    for index, item in enumerate(selected):

        filename = (
            f"{image_path.stem}"
            f"_hn_{index:02d}"
            f"_x{item['x']}"
            f"_y{item['y']}.png"
        )

        Image.fromarray(
            item["image"].astype(np.uint8)
        ).save(
            OUTPUT_DIR / filename
        )

        writer.writerow([
            image_path.name,
            item["x"],
            item["y"],
            f"{item['max']:.6f}",
            f"{item['mean']:.6f}",
            f"{item['fraction']:.6f}",
            0
        ])

        total_selected += 1

    total_images += 1

    print(
        f"{image_path.stem:<25} "
        f"candidates={len(candidates):>3} "
        f"selected={len(selected):>2}"
    )

metadata_file.close()

print()
print("=" * 60)
print("HARD NEGATIVE MINING COMPLETE")
print("=" * 60)

print(f"Training images scanned : {total_images}")
print(f"Valid candidates        : {total_candidates}")
print(f"Hard-negative patches   : {total_selected}")
print(f"Output directory        : {OUTPUT_DIR}")
print(f"Metadata                : {metadata_path}")

if total_selected > 0:
    print("Status                  : PASS")
else:
    print("Status                  : WARNING")
