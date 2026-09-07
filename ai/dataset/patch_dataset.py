from pathlib import Path
import random

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF


class ShipwreckPatchDataset(Dataset):
    """
    Patch-based AI4Shipwrecks training dataset.

    Positive patches:
        Centered on annotated shipwreck pixels.

    Negative patches:
        Explicitly verified to contain zero shipwreck pixels.
    """

    def __init__(
        self,
        image_dir: str,
        label_dir: str,
        split_file: str,
        patch_size: int = 512,
        patches_per_image: int = 8,
        positive_ratio: float = 0.5,
        seed: int = 42,
    ):
        self.image_dir = Path(image_dir)
        self.label_dir = Path(label_dir)
        self.patch_size = patch_size
        self.patches_per_image = patches_per_image
        self.positive_ratio = positive_ratio
        self.seed = seed

        split_path = Path(split_file)

        if not split_path.exists():
            raise FileNotFoundError(
                f"Split file not found: {split_path}"
            )

        self.names = [
            line.strip()
            for line in split_path.read_text().splitlines()
            if line.strip()
        ]

        if not self.names:
            raise RuntimeError(
                f"No samples found in {split_path}"
            )

        for name in self.names:
            if not (self.image_dir / name).exists():
                raise FileNotFoundError(
                    f"Image not found: {self.image_dir / name}"
                )

            if not (self.label_dir / name).exists():
                raise FileNotFoundError(
                    f"Label not found: {self.label_dir / name}"
                )

        self.rng = random.Random(seed)
        self.samples = []

        for name in self.names:
            mask = np.array(
                Image.open(
                    self.label_dir / name
                ).convert("L")
            )

            positive_pixels = np.argwhere(mask > 0)

            positive_count = 0

            if len(positive_pixels) > 0:
                positive_count = max(
                    1,
                    int(
                        patches_per_image
                        * positive_ratio
                    ),
                )

            negative_count = (
                patches_per_image - positive_count
            )

            # Positive patches.
            for _ in range(positive_count):
                y, x = positive_pixels[
                    self.rng.randrange(
                        len(positive_pixels)
                    )
                ]

                self.samples.append(
                    {
                        "name": name,
                        "x": int(x),
                        "y": int(y),
                        "positive": True,
                    }
                )

            # Negative patches.
            negative_added = 0
            attempts = 0
            max_attempts = max(
                100,
                negative_count * 100,
            )

            height, width = mask.shape

            while (
                negative_added < negative_count
                and attempts < max_attempts
            ):
                attempts += 1

                x = self.rng.randint(
                    0,
                    max(0, width - 1),
                )

                y = self.rng.randint(
                    0,
                    max(0, height - 1),
                )

                left, top, right, bottom = (
                    self._crop_bounds(
                        width,
                        height,
                        x,
                        y,
                    )
                )

                crop_mask = mask[
                    top:bottom,
                    left:right,
                ]

                if not np.any(crop_mask > 0):
                    self.samples.append(
                        {
                            "name": name,
                            "x": int(x),
                            "y": int(y),
                            "positive": False,
                        }
                    )

                    negative_added += 1

            if negative_added < negative_count:
                print(
                    f"Warning: {name} produced "
                    f"{negative_added}/{negative_count} "
                    f"negative patches."
                )

    def __len__(self):
        return len(self.samples)

    def _crop_bounds(
        self,
        width,
        height,
        x,
        y,
    ):
        size = self.patch_size

        # Pad coordinates for images smaller than patch size.
        if width < size:
            left = 0
            right = width
        else:
            left = x - size // 2
            left = max(
                0,
                min(left, width - size),
            )
            right = left + size

        if height < size:
            top = 0
            bottom = height
        else:
            top = y - size // 2
            top = max(
                0,
                min(top, height - size),
            )
            bottom = top + size

        return left, top, right, bottom

    def __getitem__(self, index):
        sample = self.samples[index]

        name = sample["name"]
        x = sample["x"]
        y = sample["y"]

        image = Image.open(
            self.image_dir / name
        ).convert("L")

        mask = Image.open(
            self.label_dir / name
        ).convert("L")

        width, height = image.size

        # Resize smaller images before cropping.
        if (
            width < self.patch_size
            or height < self.patch_size
        ):
            scale = max(
                self.patch_size / width,
                self.patch_size / height,
            )

            new_width = int(width * scale)
            new_height = int(height * scale)

            image = image.resize(
                (new_width, new_height),
                Image.Resampling.BILINEAR,
            )

            mask = mask.resize(
                (new_width, new_height),
                Image.Resampling.NEAREST,
            )

            x = int(x * scale)
            y = int(y * scale)

            width, height = image.size

        left, top, right, bottom = (
            self._crop_bounds(
                width,
                height,
                x,
                y,
            )
        )

        image = image.crop(
            (left, top, right, bottom)
        )

        mask = mask.crop(
            (left, top, right, bottom)
        )

        image = TF.resize(
            image,
            [256, 256],
            interpolation=TF.InterpolationMode.BILINEAR,
        )

        mask = TF.resize(
            mask,
            [256, 256],
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
            "positive_patch": sample["positive"],
        }


if __name__ == "__main__":
    dataset = ShipwreckPatchDataset(
        image_dir="data/raw/AI4Shipwrecks/train/images",
        label_dir="data/raw/AI4Shipwrecks/train/labels",
        split_file="data/splits/train.txt",
        patch_size=512,
        patches_per_image=8,
        positive_ratio=0.5,
    )

    print("Shipwreck Patch Dataset Test")
    print("=" * 60)
    print("Generated patches:", len(dataset))

    positive = 0
    negative = 0

    for i in range(len(dataset)):
        if dataset[i]["positive_patch"]:
            positive += 1
        else:
            negative += 1

    print("Positive patches:", positive)
    print("Negative patches:", negative)

    sample = dataset[0]

    print()
    print("Sample:", sample["name"])
    print("Image shape:", tuple(sample["image"].shape))
    print("Mask shape:", tuple(sample["mask"].shape))
    print("Image dtype:", sample["image"].dtype)
    print("Mask dtype:", sample["mask"].dtype)
    print(
        "Mask values:",
        torch.unique(sample["mask"]).tolist(),
    )
    print(
        "Positive patch:",
        sample["positive_patch"],
    )

    print()
    print("Patch dataset test: PASS")
