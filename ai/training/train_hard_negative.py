import torch
from torch.utils.data import DataLoader

from ai.dataset.hard_negative_dataset import HardNegativePatchDataset
from ai.models.unet import UNet
from ai.training.losses import BCEDiceLoss


# ============================================================
# CPU safety
# ============================================================

if not torch.cuda.is_available():
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)


DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

PATCH_SIZE = 512
MODEL_SIZE = 256

BATCH_SIZE = 1
EPOCHS = 10
LEARNING_RATE = 1e-3

HARD_NEGATIVE_COUNT = 234

CHECKPOINT = (
    "ai/training/checkpoints/"
    "hard_negative_best_unet.pt"
)


# ============================================================
# Dataset
# ============================================================

print("BlueSentinel AI — Hard Negative Training")
print("=" * 60)

print(f"Device: {DEVICE}")
print(f"Patch size: {PATCH_SIZE}")
print(f"Model input: {MODEL_SIZE}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Hard negatives: {HARD_NEGATIVE_COUNT}")
print(f"Epochs: {EPOCHS}")
print(f"Learning rate: {LEARNING_RATE}")
print()


train_dataset = HardNegativePatchDataset(
    image_size=MODEL_SIZE,
    patch_size=PATCH_SIZE,
    patches_per_image=4,
    positive_ratio=0.5,
    hard_negative_count=HARD_NEGATIVE_COUNT,
    seed=42,
)


train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
)


print()
print(f"Training samples: {len(train_dataset)}")


# ============================================================
# Model
# ============================================================

model = UNet(
    base_channels=16
).to(DEVICE)

criterion = BCEDiceLoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


print(
    f"Model parameters: "
    f"{sum(p.numel() for p in model.parameters()):,}"
)

print()


# ============================================================
# Training
# ============================================================

best_loss = float("inf")

for epoch in range(1, EPOCHS + 1):

    model.train()

    running_loss = 0.0
    positive_samples = 0
    hard_negative_samples = 0

    for batch in train_loader:

        images = batch["image"].to(DEVICE)
        masks = batch["mask"].to(DEVICE)

        batch_type = batch["type"]

        optimizer.zero_grad()

        logits = model(images)

        loss = criterion(
            logits,
            masks
        )

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        for sample_type in batch_type:

            if sample_type == "hard_negative":
                hard_negative_samples += 1
            else:
                positive_samples += int(
                    masks[0].sum().item() > 0
                )

    avg_loss = (
        running_loss /
        len(train_loader)
    )

    print(
        f"Epoch {epoch:02d}/{EPOCHS} | "
        f"Loss: {avg_loss:.4f} | "
        f"Positive samples: {positive_samples} | "
        f"Hard negatives: {hard_negative_samples}"
    )

    if avg_loss < best_loss:

        best_loss = avg_loss

        torch.save(
            {
                "model_state_dict": model.state_dict(),
                "epoch": epoch,
                "train_loss": avg_loss,
                "patch_size": PATCH_SIZE,
                "model_size": MODEL_SIZE,
                "hard_negative_count":
                    HARD_NEGATIVE_COUNT,
            },
            CHECKPOINT
        )

        print(
            f"  ✓ Best model saved: {CHECKPOINT}"
        )


print()
print("=" * 60)
print("Hard-negative training complete.")
print(f"Best training loss: {best_loss:.4f}")
print(f"Checkpoint: {CHECKPOINT}")
