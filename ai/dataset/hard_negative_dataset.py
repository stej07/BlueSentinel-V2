from pathlib import Path
import random
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF


class HardNegativePatchDataset(Dataset):
    """
    Original positive/negative training patches plus a controlled
    number of model-mined hard-negative patches.

    Hard negatives are image-only patches with guaranteed
    zero ground-truth shipwreck pixels.
    """

    def __init__(
        self,
        image_dir="data/raw/AI4Shipwrecks/train/images",
        label_dir="data/raw/AI4Shipwrecks/train/labels",
        split_file="data/splits/train.txt",
        hard_negative_dir="data/hard_negatives",
        image_size=256,
        patch_size=512,
        patches_per_image=4,
        positive_ratio=0.5,
        hard_negative_count=234,
        seed=42,
    ):
        self.image_dir = Path(image_dir)
        self.label_dir = Path(label_dir)
        self.hard_negative_dir = Path(hard_negative_dir)

        self.image_size = image_size
        self.patch_size = patch_size

        random.seed(seed)

        # ----------------------------------------------------
        # Original patch dataset logic
        # ----------------------------------------------------

        split_path = Path(split_file)

        if not split_path.exists():
            raise FileNotFoundError(split_path)

        names = [
            line.strip()
            for line in split_path.read_text().splitlines()
            if line.strip()
        ]

        self.samples = []

        rng = random.Random(seed)

        for name in names:

            image_path = self.image_dir / name
            label_path = self.label_dir / name

            image = np.array(
                Image.open(image_path).convert("L")
            )

            label = np.array(
                Image.open(label_path).convert("L")
            )

            h, w = image.shape

            positive_y, positive_x = np.where(
                label > 0
            )

            positive_available = len(positive_y) > 0

            for _ in range(patches_per_image):

                # --------------------------------------------
                # Positive patch
                # --------------------------------------------

                if (
                    positive_available
                    and rng.random() < positive_ratio
                ):

                    index = rng.randrange(
                        len(positive_y)
                    )

                    cy = int(positive_y[index])
                    cx = int(positive_x[index])

                # --------------------------------------------
                # Negative patch
                # --------------------------------------------

                else:

                    found = False

                    for _attempt in range(100):

                        cy = rng.randint(
                            0,
                            max(0, h - 1)
                        )

                        cx = rng.randint(
                            0,
                            max(0, w - 1)
                        )

                        y1 = max(
                            0,
                            min(
                                cy - patch_size // 2,
                                h - patch_size
                            )
                        )

                        x1 = max(
                            0,
                            min(
                                cx - patch_size // 2,
                                w - patch_size
                            )
                        )

                        y2 = min(
                            y1 + patch_size,
                            h
                        )

                        x2 = min(
                            x1 + patch_size,
                            w
                        )

                        if not np.any(
                            label[y1:y2, x1:x2] > 0
                        ):
                            found = True
                            break

                    if not found:
                        continue

                y1 = max(
                    0,
                    min(
                        cy - patch_size // 2,
                        h - patch_size
                    )
                )

                x1 = max(
                    0,
                    min(
                        cx - patch_size // 2,
                        w - patch_size
                    )
                )

                y2 = min(
                    y1 + patch_size,
                    h
                )

                x2 = min(
                    x1 + patch_size,
                    w
                )

                self.samples.append(
                    {
                        "image": image_path,
                        "label": label_path,
                        "x": x1,
                        "y": y1,
                        "x2": x2,
                        "y2": y2,
                        "type": "original",
                    }
                )

        original_count = len(self.samples)

        # ----------------------------------------------------
        # Add hard negatives
        # ----------------------------------------------------

        hard_files = sorted(
            self.hard_negative_dir.glob("*.png")
        )

        if len(hard_files) < hard_negative_count:
            raise RuntimeError(
                f"Only {len(hard_files)} hard negatives found; "
                f"need {hard_negative_count}."
            )

        selected_hard = rng.sample(
            hard_files,
            hard_negative_count
        )

        for path in selected_hard:

            self.samples.append(
                {
                    "image": path,
                    "label": None,
                    "x": 0,
                    "y": 0,
                    "x2": patch_size,
                    "y2": patch_size,
                    "type": "hard_negative",
                }
            )

        self.original_count = original_count
        self.hard_negative_count = len(selected_hard)

        print(
            f"Original patches      : "
            f"{self.original_count}"
        )

        print(
            f"Hard-negative patches : "
            f"{self.hard_negative_count}"
        )

        print(
            f"Combined patches      : "
            f"{len(self.samples)}"
        )

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):

        sample = self.samples[index]

        image = Image.open(
            sample["image"]
        ).convert("L")

        # ----------------------------------------------------
        # Hard negative: entire image is background
        # ----------------------------------------------------

        if sample["type"] == "hard_negative":

            image = TF.resize(
                image,
                [self.image_size, self.image_size],
                interpolation=TF.InterpolationMode.BILINEAR,
            )

            mask = torch.zeros(
                1,
                self.image_size,
                self.image_size,
                dtype=torch.float32,
            )

        # ----------------------------------------------------
        # Original patch
        # ----------------------------------------------------

        else:

            label = Image.open(
                sample["label"]
            ).convert("L")

            x1 = sample["x"]
            y1 = sample["y"]
            x2 = sample["x2"]
            y2 = sample["y2"]

            image = image.crop(
                (x1, y1, x2, y2)
            )

            label = label.crop(
                (x1, y1, x2, y2)
            )

            image = TF.resize(
                image,
                [self.image_size, self.image_size],
                interpolation=TF.InterpolationMode.BILINEAR,
            )

            label = TF.resize(
                label,
                [self.image_size, self.image_size],
                interpolation=TF.InterpolationMode.NEAREST,
            )

            mask = TF.to_tensor(label)

            mask = (
                mask > 0
            ).float()

        image = TF.to_tensor(image)

        image = (
            image - 0.5
        ) / 0.5

        return {
            "image": image,
            "mask": mask,
            "type": sample["type"],
        }


if __name__ == "__main__":

    dataset = HardNegativePatchDataset()

    print()
    print("Dataset Test")
    print("=" * 50)

    print("Length:", len(dataset))

    sample = dataset[0]

    print(
        "Image shape:",
        tuple(sample["image"].shape)
    )

    print(
        "Mask shape:",
        tuple(sample["mask"].shape)
    )

    print(
        "Mask values:",
        torch.unique(sample["mask"]).tolist()
    )

    print("Dataset test: PASS")
