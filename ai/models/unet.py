import torch
import torch.nn as nn


class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()

        self.block = nn.Sequential(
            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size=3,
                padding=1,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),

            nn.Conv2d(
                out_channels,
                out_channels,
                kernel_size=3,
                padding=1,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class UNet(nn.Module):
    """
    Lightweight U-Net for binary AI4Shipwrecks segmentation.

    Input:
        [B, 1, H, W]

    Output:
        [B, 1, H, W]

    Output contains logits, not probabilities.
    Apply sigmoid during inference.
    """

    def __init__(self, base_channels=16):
        super().__init__()

        self.encoder1 = DoubleConv(1, base_channels)
        self.encoder2 = DoubleConv(base_channels, base_channels * 2)
        self.encoder3 = DoubleConv(base_channels * 2, base_channels * 4)

        self.pool = nn.MaxPool2d(2)

        self.bottleneck = DoubleConv(
            base_channels * 4,
            base_channels * 8,
        )

        self.up3 = nn.ConvTranspose2d(
            base_channels * 8,
            base_channels * 4,
            kernel_size=2,
            stride=2,
        )
        self.decoder3 = DoubleConv(
            base_channels * 8,
            base_channels * 4,
        )

        self.up2 = nn.ConvTranspose2d(
            base_channels * 4,
            base_channels * 2,
            kernel_size=2,
            stride=2,
        )
        self.decoder2 = DoubleConv(
            base_channels * 4,
            base_channels * 2,
        )

        self.up1 = nn.ConvTranspose2d(
            base_channels * 2,
            base_channels,
            kernel_size=2,
            stride=2,
        )
        self.decoder1 = DoubleConv(
            base_channels * 2,
            base_channels,
        )

        self.output = nn.Conv2d(
            base_channels,
            1,
            kernel_size=1,
        )

    def forward(self, x):
        e1 = self.encoder1(x)

        e2 = self.encoder2(
            self.pool(e1)
        )

        e3 = self.encoder3(
            self.pool(e2)
        )

        b = self.bottleneck(
            self.pool(e3)
        )

        d3 = self.up3(b)
        d3 = torch.cat([d3, e3], dim=1)
        d3 = self.decoder3(d3)

        d2 = self.up2(d3)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.decoder2(d2)

        d1 = self.up1(d2)
        d1 = torch.cat([d1, e1], dim=1)
        d1 = self.decoder1(d1)

        return self.output(d1)


if __name__ == "__main__":
    model = UNet()

    x = torch.randn(2, 1, 512, 512)

    with torch.no_grad():
        y = model(x)

    print("U-Net Model Test")
    print("=" * 50)
    print("Input shape :", tuple(x.shape))
    print("Output shape:", tuple(y.shape))
    print("Parameters  :", sum(p.numel() for p in model.parameters()))
    print("Output dtype:", y.dtype)
    print()
    print("Model test: PASS")
