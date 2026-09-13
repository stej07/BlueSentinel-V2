import torch
import torch.nn as nn
import torch.nn.functional as F


CLASS_WEIGHTS = torch.tensor(
    [0.15, 1.25, 0.80, 1.20, 1.35],
    dtype=torch.float32
)


class MultiClassDiceLoss(nn.Module):
    def __init__(self, num_classes=5, smooth=1.0):
        super().__init__()
        self.num_classes = num_classes
        self.smooth = smooth

    def forward(self, logits, target):
        probabilities = torch.softmax(logits, dim=1)

        target_one_hot = F.one_hot(
            target,
            num_classes=self.num_classes
        ).permute(0, 3, 1, 2).float()

        dims = (0, 2, 3)

        intersection = (
            probabilities * target_one_hot
        ).sum(dims)

        denominator = (
            probabilities.sum(dims)
            + target_one_hot.sum(dims)
        )

        dice = (
            2.0 * intersection + self.smooth
        ) / (
            denominator + self.smooth
        )

        weights = CLASS_WEIGHTS.to(logits.device)

        return 1.0 - (dice * weights).sum() / weights.sum()


class CombinedLoss(nn.Module):
    def __init__(self, num_classes=5):
        super().__init__()

        weights = CLASS_WEIGHTS / CLASS_WEIGHTS.sum() * num_classes

        self.cross_entropy = nn.CrossEntropyLoss(
            weight=weights
        )

        self.dice = MultiClassDiceLoss(
            num_classes=num_classes
        )

    def forward(self, logits, target):
        ce = self.cross_entropy(logits, target)
        dice = self.dice(logits, target)

        return 0.5 * ce + 0.5 * dice
