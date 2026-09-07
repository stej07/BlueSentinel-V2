import torch
import torch.nn as nn


class DiceLoss(nn.Module):
    """
    Dice loss for binary segmentation.

    Operates on logits so sigmoid is applied internally.
    """

    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits, targets):
        probabilities = torch.sigmoid(logits)

        probabilities = probabilities.reshape(-1)
        targets = targets.reshape(-1)

        intersection = (probabilities * targets).sum()

        dice = (
            (2.0 * intersection + self.smooth)
            / (
                probabilities.sum()
                + targets.sum()
                + self.smooth
            )
        )

        return 1.0 - dice


class BCEDiceLoss(nn.Module):
    """
    Combined Binary Cross Entropy + Dice loss.
    """

    def __init__(self, bce_weight=0.5, dice_weight=0.5):
        super().__init__()

        self.dice = DiceLoss()

        self.bce_weight = bce_weight
        self.dice_weight = dice_weight

    def forward(self, logits, targets):
        # Estimate positive-pixel frequency for this batch.
        positive = targets.sum()
        total = targets.numel()

        # Give foreground pixels more weight when they are rare.
        positive_fraction = positive / (total + 1e-8)
        positive_weight = ((1.0 - positive_fraction) / (positive_fraction + 1e-8)).clamp(
            min=1.0,
            max=20.0,
        )

        bce = nn.functional.binary_cross_entropy_with_logits(
            logits,
            targets,
            pos_weight=positive_weight,
        )

        dice_loss = self.dice(logits, targets)

        total_loss = (
            self.bce_weight * bce
            + self.dice_weight * dice_loss
        )

        return total_loss


if __name__ == "__main__":
    torch.manual_seed(42)

    logits = torch.randn(2, 1, 64, 64)
    targets = torch.randint(
        0,
        2,
        (2, 1, 64, 64),
    ).float()

    criterion = BCEDiceLoss()

    loss = criterion(logits, targets)

    print("Loss Function Test")
    print("=" * 50)
    print("Logits shape :", tuple(logits.shape))
    print("Targets shape:", tuple(targets.shape))
    print("Loss         :", float(loss))
    print("Finite loss  :", torch.isfinite(loss).item())
    print()
    print("Loss test: PASS")
