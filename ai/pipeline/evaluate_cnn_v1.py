from pathlib import Path
import json
import math

import numpy as np
import torch
from PIL import Image
from ai.models.unet import UNet


ROOT = Path(".")

TRAIN_DIR = ROOT / "data/raw/AI4Shipwrecks/train"
TEST_DIR = ROOT / "data/raw/AI4Shipwrecks/test"

SPLIT_DIR = ROOT / "data/splits"

CHECKPOINT = (
    ROOT
    / "ai/training/bluesentinel_cnn_v1"
    / "bluesentinel_cnn_v1.pt"
)

OUTPUT_DIR = (
    ROOT
    / "ai/training/bluesentinel_cnn_v1"
    / "outputs"
)

VAL_PROB_DIR = OUTPUT_DIR / "validation_probability_maps"
VAL_MASK_DIR = OUTPUT_DIR / "validation_masks"

TEST_PROB_DIR = OUTPUT_DIR / "test_probability_maps"
TEST_MASK_DIR = OUTPUT_DIR / "test_masks"

PATCH_SIZE = 512
MODEL_SIZE = 256
STRIDE = 384

DEVICE = torch.device("cpu")

THRESHOLDS = [
    0.05,
    0.10,
    0.15,
    0.20,
    0.25,
    0.30,
    0.35,
    0.40,
    0.45,
    0.50,
    0.55,
    0.60,
    0.65,
    0.70,
    0.75,
    0.80,
    0.85,
    0.90,
    0.95,
]


def load_model():
    print("=" * 70)
    print("LOADING BLUESENTINEL CNN V1")
    print("=" * 70)

    model = UNet(base_channels=16).to(DEVICE)

    checkpoint = torch.load(
        CHECKPOINT,
        map_location=DEVICE,
        weights_only=False,
    )

    state = checkpoint.get("model_state_dict", checkpoint)

    model.load_state_dict(state)
    model.eval()

    print("Checkpoint :", CHECKPOINT)
    print("Best epoch :", checkpoint.get("epoch", "unknown"))
    print("Val Dice   :", checkpoint.get("val_dice", "unknown"))
    print("Device     :", DEVICE)
    print("Status     : PASS")

    return model


def read_names(path):
    return [
        x.strip()
        for x in path.read_text().splitlines()
        if x.strip()
    ]


def load_image(path):
    image = Image.open(path).convert("L")
    return np.asarray(image, dtype=np.float32) / 255.0


def load_mask(path):
    mask = Image.open(path).convert("L")
    return np.asarray(mask) > 0


def predict_tiled(model, image):
    height, width = image.shape

    probability = np.zeros(
        (height, width),
        dtype=np.float32,
    )

    weight = np.zeros(
        (height, width),
        dtype=np.float32,
    )

    y_positions = list(
        range(
            0,
            max(1, height - PATCH_SIZE + 1),
            STRIDE,
        )
    )

    x_positions = list(
        range(
            0,
            max(1, width - PATCH_SIZE + 1),
            STRIDE,
        )
    )

    if not y_positions or y_positions[-1] != max(
        0, height - PATCH_SIZE
    ):
        y_positions.append(max(0, height - PATCH_SIZE))

    if not x_positions or x_positions[-1] != max(
        0, width - PATCH_SIZE
    ):
        x_positions.append(max(0, width - PATCH_SIZE))

    with torch.no_grad():

        for top in y_positions:
            for left in x_positions:

                patch = image[
                    top:top + PATCH_SIZE,
                    left:left + PATCH_SIZE,
                ]

                ph, pw = patch.shape

                padded = np.zeros(
                    (PATCH_SIZE, PATCH_SIZE),
                    dtype=np.float32,
                )

                padded[:ph, :pw] = patch

                tensor = torch.from_numpy(
                    padded
                ).unsqueeze(0).unsqueeze(0)

                tensor = torch.nn.functional.interpolate(
                    tensor,
                    size=(MODEL_SIZE, MODEL_SIZE),
                    mode="bilinear",
                    align_corners=False,
                )

                tensor = (tensor - 0.5) / 0.5
                tensor = tensor.to(DEVICE)

                logits = model(tensor)
                probs = torch.sigmoid(logits)

                probs = torch.nn.functional.interpolate(
                    probs,
                    size=(PATCH_SIZE, PATCH_SIZE),
                    mode="bilinear",
                    align_corners=False,
                )

                probs = probs[0, 0].cpu().numpy()

                probs = probs[:ph, :pw]

                probability[
                    top:top + ph,
                    left:left + pw
                ] += probs

                weight[
                    top:top + ph,
                    left:left + pw
                ] += 1.0

    probability /= np.maximum(weight, 1e-6)

    return probability


def scores(probability, target, threshold):
    prediction = probability >= threshold

    prediction = prediction.astype(bool)
    target = target.astype(bool)

    intersection = np.logical_and(
        prediction,
        target,
    ).sum()

    pred_pixels = prediction.sum()
    target_pixels = target.sum()

    union = np.logical_or(
        prediction,
        target,
    ).sum()

    dice = (
        2 * intersection + 1
    ) / (
        pred_pixels + target_pixels + 1
    )

    iou = (
        intersection + 1
    ) / (
        union + 1
    )

    precision = (
        intersection + 1
    ) / (
        pred_pixels + 1
    )

    recall = (
        intersection + 1
    ) / (
        target_pixels + 1
    )

    return {
        "dice": float(dice),
        "iou": float(iou),
        "precision": float(precision),
        "recall": float(recall),
        "predicted_pixels": int(pred_pixels),
        "target_pixels": int(target_pixels),
    }


def evaluate_set(
    model,
    image_dir,
    label_dir,
    names,
    save_probability_dir=None,
    save_mask_dir=None,
    threshold=None,
):
    aggregate = {
        "intersection": 0,
        "prediction": 0,
        "target": 0,
        "union": 0,
    }

    results = []

    if save_probability_dir:
        save_probability_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    if save_mask_dir:
        save_mask_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    for index, name in enumerate(names, 1):

        image_path = image_dir / name
        label_path = label_dir / name

        image = load_image(image_path)
        target = load_mask(label_path)

        probability = predict_tiled(
            model,
            image,
        )

        if save_probability_dir:
            probability_u8 = np.clip(
                probability * 255.0,
                0,
                255,
            ).astype(np.uint8)

            Image.fromarray(
                probability_u8
            ).save(
                save_probability_dir / name
            )

        if threshold is not None:

            prediction = probability >= threshold

            if save_mask_dir:
                mask_u8 = (
                    prediction.astype(np.uint8)
                    * 255
                )

                Image.fromarray(
                    mask_u8
                ).save(
                    save_mask_dir / name
                )

            intersection = np.logical_and(
                prediction,
                target,
            ).sum()

            pred_pixels = prediction.sum()
            target_pixels = target.sum()

            union = np.logical_or(
                prediction,
                target,
            ).sum()

            aggregate["intersection"] += int(
                intersection
            )
            aggregate["prediction"] += int(
                pred_pixels
            )
            aggregate["target"] += int(
                target_pixels
            )
            aggregate["union"] += int(
                union
            )

            result = scores(
                probability,
                target,
                threshold,
            )

            result["name"] = name
            results.append(result)

        print(
            f"[{index:03d}/{len(names):03d}] {name}"
        )

    if threshold is None:
        return None, results

    i = aggregate["intersection"]
    p = aggregate["prediction"]
    t = aggregate["target"]
    u = aggregate["union"]

    return {
        "dice": float((2 * i + 1) / (p + t + 1)),
        "iou": float((i + 1) / (u + 1)),
        "precision": float((i + 1) / (p + 1)),
        "recall": float((i + 1) / (t + 1)),
        "predicted_pixels": int(p),
        "target_pixels": int(t),
    }, results


def main():

    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    torch.manual_seed(26057)

    model = load_model()

    val_names = read_names(
        SPLIT_DIR / "val.txt"
    )

    test_images = sorted(
        TEST_DIR.joinpath("images").glob("*.png")
    )

    test_names = [
        x.name
        for x in test_images
        if (TEST_DIR / "labels" / x.name).exists()
    ]

    print()
    print("=" * 70)
    print("STEP 1 — VALIDATION THRESHOLD CALIBRATION")
    print("=" * 70)

    print("Validation images:", len(val_names))

    val_probability_dir = (
        OUTPUT_DIR / "validation_probability_maps"
    )

    # Generate validation probability maps once.
    evaluate_set(
        model,
        TRAIN_DIR / "images",
        TRAIN_DIR / "labels",
        val_names,
        save_probability_dir=val_probability_dir,
    )

    val_results = []

    for threshold in THRESHOLDS:

        metrics, _ = evaluate_set(
            model,
            TRAIN_DIR / "images",
            TRAIN_DIR / "labels",
            val_names,
            threshold=threshold,
        )

        val_results.append(
            {
                "threshold": threshold,
                **metrics,
            }
        )

        print(
            f"Threshold {threshold:.2f} | "
            f"Dice {metrics['dice']:.4f} | "
            f"IoU {metrics['iou']:.4f} | "
            f"Precision {metrics['precision']:.4f} | "
            f"Recall {metrics['recall']:.4f}"
        )

    best = max(
        val_results,
        key=lambda x: x["dice"],
    )

    threshold = best["threshold"]

    print()
    print("BEST VALIDATION THRESHOLD")
    print("-" * 70)
    print(f"Threshold : {threshold:.2f}")
    print(f"Dice      : {best['dice']:.4f}")
    print(f"IoU       : {best['iou']:.4f}")
    print(f"Precision : {best['precision']:.4f}")
    print(f"Recall    : {best['recall']:.4f}")

    print()
    print("=" * 70)
    print("STEP 2 — UNTOUCHED TEST EVALUATION")
    print("=" * 70)

    print("Test images:", len(test_names))
    print("Test set used for training: NO")
    print("Threshold frozen from validation:", threshold)

    test_metrics, test_results = evaluate_set(
        model,
        TEST_DIR / "images",
        TEST_DIR / "labels",
        test_names,
        save_probability_dir=TEST_PROB_DIR,
        save_mask_dir=TEST_MASK_DIR,
        threshold=threshold,
    )

    print()
    print("FINAL TEST RESULTS")
    print("-" * 70)
    print(f"Dice      : {test_metrics['dice']:.4f}")
    print(f"IoU       : {test_metrics['iou']:.4f}")
    print(f"Precision : {test_metrics['precision']:.4f}")
    print(f"Recall    : {test_metrics['recall']:.4f}")

    test_total_pixels = sum(
        load_image(TEST_DIR / "images" / name).size
        for name in test_names
    )

    predicted_percent = (
        test_metrics["predicted_pixels"]
        / max(test_total_pixels, 1)
        * 100
    )

    target_percent = (
        test_metrics["target_pixels"]
        / max(test_total_pixels, 1)
        * 100
    )

    print(
        f"Predicted foreground: {predicted_percent:.4f}%"
    )

    print(
        f"Ground-truth foreground: {target_percent:.4f}%"
    )

    report = {
        "model": "BlueSentinel CNN U-Net v1",
        "checkpoint": str(CHECKPOINT.resolve()),
        "task": "binary shipwreck segmentation",
        "dataset": "AI4Shipwrecks",
        "group_aware_split": True,
        "validation_groups": [
            "Montana",
            "WP_Rend",
            "Grecian",
        ],
        "validation_images": len(val_names),
        "test_images": len(test_names),
        "threshold_candidates": THRESHOLDS,
        "selected_threshold": threshold,
        "validation_best": best,
        "test_metrics": test_metrics,
        "test_predicted_foreground_percent": predicted_percent,
        "test_ground_truth_foreground_percent": target_percent,
        "outputs": {
            "test_probability_maps": str(
                TEST_PROB_DIR.resolve()
            ),
            "test_masks": str(
                TEST_MASK_DIR.resolve()
            ),
        },
    }

    report_path = (
        OUTPUT_DIR
        / "evaluation_report.json"
    )

    report_path.write_text(
        json.dumps(
            report,
            indent=2,
        )
    )

    print()
    print("=" * 70)
    print("CNN EVALUATION COMPLETE")
    print("=" * 70)
    print("Evaluation report:", report_path)
    print("Probability maps :", TEST_PROB_DIR)
    print("Segmentation masks:", TEST_MASK_DIR)


if __name__ == "__main__":
    main()
