from pathlib import Path
from PIL import Image, ImageDraw
import shutil

ROOT = Path("data/drishti_sss")
OUT = Path("data/drishti_masks")

CLASS_NAMES = {
    0: "background",
    1: "submarine_pipeline",
    2: "shipwreck",
    3: "ghost_net",
    4: "mine_cylinder",
}

for split in ["train", "val", "test"]:
    image_dir = ROOT / split / "images"
    label_dir = ROOT / split / "labels"
    out_image_dir = OUT / split / "images"
    out_mask_dir = OUT / split / "masks"

    out_image_dir.mkdir(parents=True, exist_ok=True)
    out_mask_dir.mkdir(parents=True, exist_ok=True)

    for image_path in image_dir.iterdir():
        if not image_path.is_file():
            continue

        with Image.open(image_path) as image:
            width, height = image.size

        mask = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(mask)

        label_path = label_dir / f"{image_path.stem}.txt"

        if label_path.exists():
            for line in label_path.read_text(errors="ignore").splitlines():
                parts = line.split()

                if len(parts) != 5:
                    continue

                try:
                    class_id = int(parts[0])
                    cx, cy, bw, bh = map(float, parts[1:])
                except ValueError:
                    continue

                if class_id not in CLASS_NAMES or class_id == 0:
                    continue

                x1 = max(0, int((cx - bw / 2) * width))
                y1 = max(0, int((cy - bh / 2) * height))
                x2 = min(width - 1, int((cx + bw / 2) * width))
                y2 = min(height - 1, int((cy + bh / 2) * height))

                if x2 >= x1 and y2 >= y1:
                    draw.rectangle([x1, y1, x2, y2], fill=class_id)

        shutil.copy2(image_path, out_image_dir / image_path.name)
        mask.save(out_mask_dir / f"{image_path.stem}.png")

    print(f"{split}: generated")

print("\nMask generation complete.")
print("Classes:")
for k, v in CLASS_NAMES.items():
    print(f"  {k}: {v}")
