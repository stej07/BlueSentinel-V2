import json
import sys
from pathlib import Path

import torch
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path("ai/dataset").resolve()))
sys.path.insert(0, str(Path("ai/models").resolve()))
sys.path.insert(0, str(Path("ai/training").resolve()))

from multiclass_dataset import MarineAnomalyDataset
from multiclass_unet import MultiClassUNet
from multiclass_loss import CombinedLoss


NUM_CLASSES = 5
IMAGE_SIZE = 256
BATCH_SIZE = 8
EPOCHS = 15
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-4
BASE_CHANNELS = 8

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

OUTPUT_DIR = Path("ai/training/bluesentinel_multiclass_v1")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BEST_PATH = OUTPUT_DIR / "best_multiclass_unet.pt"
LAST_PATH = OUTPUT_DIR / "last_multiclass_unet.pt"
HISTORY_PATH = OUTPUT_DIR / "training_history.json"

CLASS_NAMES = [
    "background",
    "submarine_pipeline",
    "shipwreck",
    "ghost_net",
    "mine_cylinder",
]


def calculate_metrics(logits, target):
    prediction = torch.argmax(logits, dim=1)

    dice_scores = []
    iou_scores = []

    for c in range(NUM_CLASSES):
        pred = prediction == c
        true = target == c

        intersection = (pred & true).sum().float()
        pred_area = pred.sum().float()
        true_area = true.sum().float()

        dice = (
            (2 * intersection + 1e-6)
            / (pred_area + true_area + 1e-6)
        )

        union = pred_area + true_area - intersection

        iou = (
            (intersection + 1e-6)
            / (union + 1e-6)
        )

        dice_scores.append(dice.item())
        iou_scores.append(iou.item())

    return dice_scores, iou_scores


def run_epoch(model, loader, criterion, optimizer=None, scaler=None):
    training = optimizer is not None

    if training:
        model.train()
    else:
        model.eval()

    total_loss = 0.0
    count = 0

    dice_sum = [0.0] * NUM_CLASSES
    iou_sum = [0.0] * NUM_CLASSES

    for images, masks, _ in loader:
        images = images.to(DEVICE, non_blocking=True)
        masks = masks.to(DEVICE, non_blocking=True)

        if training:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(training):
            if scaler is not None and DEVICE.type == "cuda":
                with torch.autocast(device_type="cuda"):
                    logits = model(images)
                    loss = criterion(logits, masks)

                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                logits = model(images)
                loss = criterion(logits, masks)

                if training:
                    loss.backward()
                    optimizer.step()

        batch_dice, batch_iou = calculate_metrics(
            logits.detach(),
            masks
        )

        batch_size = images.size(0)

        total_loss += loss.item() * batch_size
        count += batch_size

        for c in range(NUM_CLASSES):
            dice_sum[c] += batch_dice[c] * batch_size
            iou_sum[c] += batch_iou[c] * batch_size

    avg_loss = total_loss / max(count, 1)
    avg_dice = [x / max(count, 1) for x in dice_sum]
    avg_iou = [x / max(count, 1) for x in iou_sum]

    foreground_dice = sum(avg_dice[1:]) / (NUM_CLASSES - 1)
    foreground_iou = sum(avg_iou[1:]) / (NUM_CLASSES - 1)

    return {
        "loss": avg_loss,
        "dice": avg_dice,
        "iou": avg_iou,
        "foreground_dice": foreground_dice,
        "foreground_iou": foreground_iou,
    }


def main():
    print("=== BLUESENTINEL MULTI-CLASS CNN ===")
    print("Device:", DEVICE)
    print("Classes:", NUM_CLASSES)
    print("Image size:", IMAGE_SIZE)
    print("Batch size:", BATCH_SIZE)
    print("Epochs:", EPOCHS)

    train_dataset = MarineAnomalyDataset(
        root="data/drishti_masks",
        split="train",
        image_size=IMAGE_SIZE,
        augment=True,
    )

    val_dataset = MarineAnomalyDataset(
        root="data/drishti_masks",
        split="val",
        image_size=IMAGE_SIZE,
        augment=True,
    )

    workers = 0

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=workers,
        pin_memory=DEVICE.type == "cuda",
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=workers,
        pin_memory=DEVICE.type == "cuda",
    )

    model = MultiClassUNet(
        in_channels=1,
        num_classes=NUM_CLASSES,
        base_channels=BASE_CHANNELS,
    ).to(DEVICE)

    criterion = CombinedLoss(NUM_CLASSES)

    optimizer = AdamW(
        model.parameters(),
        lr=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
    )

    scheduler = ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=3,
        min_lr=1e-6,
    )

    scaler = (
        torch.amp.GradScaler("cuda")
        if DEVICE.type == "cuda"
        else None
    )

    history = []
    best_score = -1.0
    start_epoch = 1

    if LAST_PATH.exists():
        print("Resume checkpoint detected.")
        checkpoint = torch.load(
            LAST_PATH,
            map_location=DEVICE,
        )

        model.load_state_dict(checkpoint["model"])
        optimizer.load_state_dict(checkpoint["optimizer"])
        scheduler.load_state_dict(checkpoint["scheduler"])

        if scaler is not None and checkpoint.get("scaler"):
            scaler.load_state_dict(checkpoint["scaler"])

        start_epoch = checkpoint["epoch"] + 1
        best_score = checkpoint.get("best_score", -1.0)
        history = checkpoint.get("history", [])

        print("Resuming from epoch:", start_epoch)

    print("\nTraining samples:", len(train_dataset))
    print("Validation samples:", len(val_dataset))
    print("Parameters:", sum(p.numel() for p in model.parameters()))

    for epoch in range(start_epoch, EPOCHS + 1):
        print(f"\nEpoch {epoch}/{EPOCHS}")

        train_metrics = run_epoch(
            model,
            train_loader,
            criterion,
            optimizer,
            scaler,
        )

        with torch.no_grad():
            val_metrics = run_epoch(
                model,
                val_loader,
                criterion,
            )

        score = val_metrics["foreground_dice"]

        scheduler.step(score)

        record = {
            "epoch": epoch,
            "lr": optimizer.param_groups[0]["lr"],
            "train": train_metrics,
            "val": val_metrics,
        }

        history.append(record)

        print(
            f"train_loss={train_metrics['loss']:.4f} "
            f"train_fg_dice={train_metrics['foreground_dice']:.4f}"
        )

        print(
            f"val_loss={val_metrics['loss']:.4f} "
            f"val_fg_dice={val_metrics['foreground_dice']:.4f} "
            f"val_fg_iou={val_metrics['foreground_iou']:.4f}"
        )

        for i, name in enumerate(CLASS_NAMES):
            print(
                f"  {name:20s} "
                f"Dice={val_metrics['dice'][i]:.4f} "
                f"IoU={val_metrics['iou'][i]:.4f}"
            )

        checkpoint = {
            "epoch": epoch,
            "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict(),
            "scaler": scaler.state_dict() if scaler else None,
            "best_score": max(best_score, score),
            "history": history,
            "class_names": CLASS_NAMES,
            "num_classes": NUM_CLASSES,
            "image_size": IMAGE_SIZE,
        }

        torch.save(checkpoint, LAST_PATH)

        if score > best_score:
            best_score = score
            torch.save(checkpoint, BEST_PATH)
            print(
                f"NEW BEST CHECKPOINT: "
                f"foreground Dice={best_score:.4f}"
            )

        HISTORY_PATH.write_text(
            json.dumps(history, indent=2)
        )

    print("\n=== TRAINING COMPLETE ===")
    print("Best checkpoint:", BEST_PATH)
    print("History:", HISTORY_PATH)
    print("Best validation foreground Dice:", f"{best_score:.4f}")


if __name__ == "__main__":
    main()
