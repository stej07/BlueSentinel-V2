from pathlib import Path
from collections import defaultdict
import re
import random

DATASET = Path("data/raw/AI4Shipwrecks/train/images")
OUT = Path("data/splits")

SEED = 42

# Complete survey groups reserved for validation.
# These groups provide positive examples while remaining unseen during training.
VAL_GROUPS = {
    "Montana",
    "WP_Rend",
    "Grecian",
}

def group_name(filename: str) -> str:
    return re.sub(r"_\d+$", "", Path(filename).stem)

files = sorted(DATASET.glob("*.png"))

groups = defaultdict(list)

for file in files:
    groups[group_name(file.name)].append(file.name)

unknown = VAL_GROUPS - groups.keys()

if unknown:
    raise RuntimeError(f"Validation groups not found: {sorted(unknown)}")

train_files = []
val_files = []

for group, names in sorted(groups.items()):
    if group in VAL_GROUPS:
        val_files.extend(names)
    else:
        train_files.extend(names)

random.Random(SEED).shuffle(train_files)
random.Random(SEED).shuffle(val_files)

OUT.mkdir(parents=True, exist_ok=True)

(OUT / "train.txt").write_text("\n".join(train_files) + "\n")
(OUT / "val.txt").write_text("\n".join(val_files) + "\n")

print("GROUP-AWARE DATASET SPLIT")
print("=" * 50)

print("Validation groups:")
for group in sorted(VAL_GROUPS):
    print(f"  {group}: {len(groups[group])} images")

print()
print(f"Training images:   {len(train_files)}")
print(f"Validation images: {len(val_files)}")
print(f"Total images:      {len(train_files) + len(val_files)}")

print()
print("Training groups:")
print(", ".join(sorted(set(groups) - VAL_GROUPS)))

print()
print("Validation groups:")
print(", ".join(sorted(VAL_GROUPS)))

print()
print(f"Saved: {OUT / 'train.txt'}")
print(f"Saved: {OUT / 'val.txt'}")
