---
license: cc-by-sa-4.0
library_name: pytorch
tags:
- side-scan-sonar
- underwater
- marine-debris
- segmentation
- u-net
- pytorch
---

# BlueSentinel Multi-Class U-Net

Custom PyTorch U-Net trained for multi-class underwater side-scan sonar anomaly segmentation.

## Classes

- Submarine Pipeline
- Shipwreck
- Ghost Net
- Mine / Cylinder

The training data is derived from the public DRISHTI-SSS dataset. Original YOLO bounding-box annotations were converted to box-shaped pseudo-segmentation masks for training.

This repository contains the trained BlueSentinel model artifact used by the BlueSentinel AI backend.
