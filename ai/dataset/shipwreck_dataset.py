from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF


class AI4ShipwrecksDataset(Dataset):
    """
    AI4Shipwrecks binary shipwreck segmentation dataset.

    Each sample contains:
        image -> grayscale sonar tensor [1, H, W]
        mask  -> binary tensor [1, H, W]
    """

    def __init__(
        self,
        image_dir: str,
        label_dir: str,
        split_file: str,
        image_size: int = 512,
    ):
        self.image_dir = Path(image_dir)
        self.label_dir = Path(label_dir)
        self.image_size = image_size

        split_path = Path(split_file)

        if not split_path.exists():
            raise FileNotFoundError(f"Split file not found: {split_path}")

        self.names = [
            line.strip()
            for line in split_path.read_text().splitlines()
            if line.strip()
        ]

        if not self.names:
            raise RuntimeError(f"No samples found in {split_path}")

        for name in self.names:
            image_path = self.image_dir / name
            label_path = self.label_dir / name

            if not image_path.exists():
                raise FileNotFoundError(f"Image not found: {image_path}")

            if not label_path.exists():
                raise FileNotFoundError(f"Label not found: {label_path}")

    def __len__(self):
        return len(self.names)

    def __getitem__(self, index):
        name = self.names[index]

        image_path = self.image_dir / name
        label_path = self.label_dir / name

        image = Image.open(image_path).convert("L")
        mask = Image.open(label_path).convert("L")

        image = TF.resize(
            image,
            [self.image_size, self.image_size],
            interpolation=TF.InterpolationMode.BILINEAR,
        )

        mask = TF.resize(
            mask,
            [self.image_size, self.image_size],
            interpolation=TF.InterpolationMode.NEAREST,
        )

        image = TF.to_tensor(image)
        mask = TF.to_tensor(mask)

        mask = (mask > 0).float()

        image = (image - 0.5) / 0.5

        return {
            "image": image,
            "mask": mask,
            "name": name,
        }


if __name__ == "__main__":
    train_dataset = AI4ShipwrecksDataset(
        image_dir="data/raw/AI4Shipwrecks/train/images",
        label_dir="data/raw/AI4Shipwrecks/train/labels",
        split_file="data/splits/train.txt",
    )

    val_dataset = AI4ShipwrecksDataset(
        image_dir="data/raw/AI4Shipwrecks/train/images",
        label_dir="data/raw/AI4Shipwrecks/train/labels",
        split_file="data/splits/val.txt",
    )

    print("AI4Shipwrecks Dataset Test")
    print("=" * 50)
    print("Training samples:", len(train_dataset))
    print("Validation samples:", len(val_dataset))

    sample = train_dataset[0]

    print("Sample:", sample["name"])
    print("Image shape:", tuple(sample["image"].shape))
    print("Mask shape:", tuple(sample["mask"].shape))
    print("Image dtype:", sample["image"].dtype)
    print("Mask dtype:", sample["mask"].dtype)
    print("Image range:", float(sample["image"].min()), float(sample["image"].max()))
    print("Mask values:", torch.unique(sample["mask"]).tolist())

    print()
    print("Dataset loader test: PASS")
