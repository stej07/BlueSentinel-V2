from pathlib import Path
import random

import torch
from PIL import Image
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF


class MarineAnomalyDataset(Dataset):
    def __init__(
        self,
        root="data/drishti_masks",
        split="train",
        image_size=512,
        augment=False,
    ):
        self.root = Path(root)
        self.split = split
        self.image_size = image_size
        self.augment = augment

        self.image_dir = self.root / split / "images"
        self.mask_dir = self.root / split / "masks"

        self.images = sorted(
            [
                p for p in self.image_dir.iterdir()
                if p.is_file()
            ]
        )

        if not self.images:
            raise RuntimeError(f"No images found in {self.image_dir}")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, index):
        image_path = self.images[index]
        mask_path = self.mask_dir / f"{image_path.stem}.png"

        image = Image.open(image_path).convert("L")
        mask = Image.open(mask_path).convert("L")

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

        if self.augment:
            if random.random() < 0.5:
                image = TF.hflip(image)
                mask = TF.hflip(mask)

            if random.random() < 0.5:
                image = TF.vflip(image)
                mask = TF.vflip(mask)

        image = TF.to_tensor(image)
        image = TF.normalize(image, [0.5], [0.5])

        mask = torch.from_numpy(
            __import__("numpy").array(mask, dtype="int64")
        )

        return image, mask, image_path.name
