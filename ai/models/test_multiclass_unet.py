import torch

from multiclass_unet import MultiClassUNet

model = MultiClassUNet(
    in_channels=1,
    num_classes=5,
    base_channels=16,
)

x = torch.randn(2, 1, 512, 512)

with torch.no_grad():
    y = model(x)

print("INPUT :", tuple(x.shape))
print("OUTPUT:", tuple(y.shape))
print("PARAMS:", sum(p.numel() for p in model.parameters()))
print("EXPECTED CLASSES: 5")
print("FORWARD PASS: PASS")
