from pathlib import Path

import torch

# CPU safety for this laptop.
torch.set_num_threads(2)
torch.set_num_interop_threads(1)

from torch.utils.data import DataLoader

from ai.dataset.patch_dataset import ShipwreckPatchDataset
from ai.dataset.shipwreck_dataset import AI4ShipwrecksDataset
from ai.models.unet import UNet
from ai.training.losses import BCEDiceLoss


DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

PATCH_SIZE = 512
BATCH_SIZE = 1

# Short controlled experiment first.
EPOCHS = 10

LEARNING_RATE = 1e-3

PATCHES_PER_IMAGE = 4
POSITIVE_RATIO = 0.5

CHECKPOINT_DIR = Path(
    "ai/training/checkpoints"
)

CHECKPOINT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


def dice_score(
    logits,
    targets,
    threshold=0.5,
    smooth=1.0,
):
    probabilities = torch.sigmoid(logits)
    predictions = (
        probabilities >= threshold
    ).float()

    predictions = predictions.reshape(-1)
    targets = targets.reshape(-1)

    intersection = (
        predictions * targets
    ).sum()

    return (
        (2.0 * intersection + smooth)
        / (
            predictions.sum()
            + targets.sum()
            + smooth
        )
    )


def iou_score(
    logits,
    targets,
    threshold=0.5,
    smooth=1.0,
):
    probabilities = torch.sigmoid(logits)
    predictions = (
        probabilities >= threshold
    ).float()

    predictions = predictions.reshape(-1)
    targets = targets.reshape(-1)

    intersection = (
        predictions * targets
    ).sum()

    union = (
        predictions.sum()
        + targets.sum()
        - intersection
    )

    return (
        (intersection + smooth)
        / (union + smooth)
    )


def run_epoch(
    model,
    loader,
    criterion,
    optimizer=None,
):
    training = optimizer is not None

    if training:
        model.train()
    else:
        model.eval()

    total_loss = 0.0
    total_dice = 0.0
    total_iou = 0.0

    for batch in loader:
        images = batch["image"].to(DEVICE)
        masks = batch["mask"].to(DEVICE)

        if training:
            optimizer.zero_grad(
                set_to_none=True
            )

        with torch.set_grad_enabled(training):
            logits = model(images)

            loss = criterion(
                logits,
                masks,
            )

            if training:
                loss.backward()
                optimizer.step()

        total_loss += loss.item()

        total_dice += dice_score(
            logits.detach(),
            masks,
        ).item()

        total_iou += iou_score(
            logits.detach(),
            masks,
        ).item()

    count = len(loader)

    return (
        total_loss / count,
        total_dice / count,
        total_iou / count,
    )


def main():

    print("BlueSentinel AI Patch Training")
    print("=" * 60)
    print("Device:", DEVICE)
    print("Patch size:", PATCH_SIZE)
    print("Batch size:", BATCH_SIZE)
    print("Patches per image:", PATCHES_PER_IMAGE)
    print("Positive ratio:", POSITIVE_RATIO)
    print("Epochs:", EPOCHS)
    print("Learning rate:", LEARNING_RATE)
    print()

    # ---------------------------------------------------------
    # PATCH-BASED TRAINING DATA
    # ---------------------------------------------------------

    train_dataset = ShipwreckPatchDataset(
        image_dir=(
            "data/raw/AI4Shipwrecks/"
            "train/images"
        ),
        label_dir=(
            "data/raw/AI4Shipwrecks/"
            "train/labels"
        ),
        split_file="data/splits/train.txt",
        patch_size=PATCH_SIZE,
        patches_per_image=PATCHES_PER_IMAGE,
        positive_ratio=POSITIVE_RATIO,
        seed=42,
    )

    # ---------------------------------------------------------
    # FULL-IMAGE VALIDATION
    #
    # Validation groups remain completely separate:
    # Montana, WP_Rend, Grecian.
    # ---------------------------------------------------------

    val_dataset = AI4ShipwrecksDataset(
        image_dir=(
            "data/raw/AI4Shipwrecks/"
            "train/images"
        ),
        label_dir=(
            "data/raw/AI4Shipwrecks/"
            "train/labels"
        ),
        split_file="data/splits/val.txt",
        image_size=PATCH_SIZE,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
    )

    print(
        "Training patches:",
        len(train_dataset),
    )

    print(
        "Validation images:",
        len(val_dataset),
    )

    print()

    # ---------------------------------------------------------
    # MODEL
    # ---------------------------------------------------------

    model = UNet(
        base_channels=16
    ).to(DEVICE)

    parameter_count = sum(
        p.numel()
        for p in model.parameters()
    )

    print(
        "Model parameters:",
        f"{parameter_count:,}",
    )

    criterion = BCEDiceLoss()

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=LEARNING_RATE,
    )

    best_val_dice = -1.0

    # ---------------------------------------------------------
    # TRAINING
    # ---------------------------------------------------------

    for epoch in range(
        1,
        EPOCHS + 1,
    ):

        train_loss, train_dice, train_iou = (
            run_epoch(
                model,
                train_loader,
                criterion,
                optimizer,
            )
        )

        with torch.no_grad():
            val_loss, val_dice, val_iou = (
                run_epoch(
                    model,
                    val_loader,
                    criterion,
                )
            )

        print(
            f"Epoch {epoch:02d}/{EPOCHS} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Train Dice: {train_dice:.4f} | "
            f"Train IoU: {train_iou:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val Dice: {val_dice:.4f} | "
            f"Val IoU: {val_iou:.4f}"
        )

        if val_dice > best_val_dice:

            best_val_dice = val_dice

            checkpoint = (
                CHECKPOINT_DIR
                / "best_unet.pt"
            )

            torch.save(
                {
                    "model_state_dict":
                        model.state_dict(),
                    "val_dice":
                        best_val_dice,
                    "epoch":
                        epoch,
                    "patch_size":
                        PATCH_SIZE,
                    "patches_per_image":
                        PATCHES_PER_IMAGE,
                    "positive_ratio":
                        POSITIVE_RATIO,
                },
                checkpoint,
            )

            print(
                f"  ✓ Best model saved: "
                f"{checkpoint}"
            )

    print()
    print("Training complete.")
    print(
        f"Best validation Dice: "
        f"{best_val_dice:.4f}"
    )


if __name__ == "__main__":
    main()
