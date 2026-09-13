from pathlib import Path
import torch
from torch.utils.data import DataLoader
from ai.models.multiclass_unet import MultiClassUNet
from ai.dataset.multiclass_dataset import MarineAnomalyDataset
from ai.training.multiclass_loss import CombinedLoss, CLASS_WEIGHTS

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
DATA_ROOT = "data/targeted_finetune"
BASE = "ai/training/bluesentinel_multiclass_targeted/base_epoch15.pt"
OUT = Path("ai/training/bluesentinel_multiclass_targeted")
EPOCHS = 3
BATCH_SIZE = 8

ds = MarineAnomalyDataset(DATA_ROOT, split="", image_size=256, augment=True)
loader = DataLoader(ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)

model = MultiClassUNet(in_channels=1, num_classes=5, base_channels=8).to(DEVICE)
ckpt = torch.load(BASE, map_location=DEVICE)
model.load_state_dict(ckpt["model"])

optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)
criterion = CombinedLoss(num_classes=5)

model.train()

for epoch in range(1, EPOCHS + 1):
    total = 0.0

    for images, masks, _ in loader:
        images = images.to(DEVICE)
        masks = masks.to(DEVICE)

        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, masks)
        loss.backward()
        optimizer.step()

        total += loss.item()

    avg = total / len(loader)
    print(f"Epoch {epoch}/{EPOCHS} | loss={avg:.4f}", flush=True)

torch.save({
    "model": model.state_dict(),
    "source_checkpoint": BASE,
    "epochs": EPOCHS,
    "dataset_size": len(ds),
    "classes": 5,
}, OUT / "targeted_finetuned.pt")

print(f"Saved: {OUT / 'targeted_finetuned.pt'}", flush=True)
