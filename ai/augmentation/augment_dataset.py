from pathlib import Path
import cv2
import numpy as np
import json

PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_DIR = PROJECT_ROOT / "data" / "preprocessed"
OUTPUT_DIR = PROJECT_ROOT / "data" / "augmented"
CLASSES_FILE = PROJECT_ROOT / "data" / "metadata" / "classes.json"

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp",
}


def load_classes():
    with open(CLASSES_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    classes = []

    for item in data["classes"]:
        if "folder" in item:
            classes.append(item["folder"])
        elif "name" in item:
            classes.append(item["name"])

    return classes


def rotate_image(image, angle):
    height, width = image.shape[:2]

    center = (width // 2, height // 2)

    matrix = cv2.getRotationMatrix2D(
        center,
        angle,
        1.0
    )

    return cv2.warpAffine(
        image,
        matrix,
        (width, height),
        borderMode=cv2.BORDER_REFLECT
    )


def change_brightness(image, value):
    result = image.astype(np.int16) + value
    return np.clip(result, 0, 255).astype(np.uint8)


def change_contrast(image, factor):
    result = image.astype(np.float32) * factor
    return np.clip(result, 0, 255).astype(np.uint8)


def augment_image(image):
    augmented = {}

    # Original
    augmented["original"] = image

    # Horizontal flip
    augmented["flip"] = cv2.flip(
        image,
        1
    )

    # Rotation
    augmented["rotate_plus15"] = rotate_image(
        image,
        15
    )

    augmented["rotate_minus15"] = rotate_image(
        image,
        -15
    )

    # Brightness
    augmented["brightness_up"] = change_brightness(
        image,
        30
    )

    augmented["brightness_down"] = change_brightness(
        image,
        -30
    )

    # Contrast
    augmented["contrast_up"] = change_contrast(
        image,
        1.25
    )

    augmented["contrast_down"] = change_contrast(
        image,
        0.80
    )

    return augmented


def main():

    classes = load_classes()

    total_input = 0
    total_output = 0

    print()
    print("BlueSentinel - Sonar Augmentation")
    print("=" * 55)
    print(
        "Original -> Flip -> Rotation -> "
        "Brightness -> Contrast"
    )
    print("=" * 55)

    for class_name in classes:

        input_class = INPUT_DIR / class_name
        output_class = OUTPUT_DIR / class_name

        output_class.mkdir(
            parents=True,
            exist_ok=True
        )

        if not input_class.exists():
            print(
                f"\n[SKIP] {class_name}: "
                "folder not found"
            )
            continue

        images = [
            p for p in input_class.iterdir()
            if p.is_file()
            and p.suffix.lower() in IMAGE_EXTENSIONS
        ]

        print()
        print(f"[{class_name}]")
        print(f"Input images: {len(images)}")

        class_output = 0

        for image_path in images:

            image = cv2.imread(
                str(image_path),
                cv2.IMREAD_GRAYSCALE
            )

            if image is None:
                print(
                    f"  [ERROR] {image_path.name}"
                )
                continue

            total_input += 1

            variants = augment_image(image)

            stem = image_path.stem

            for name, variant in variants.items():

                output_name = (
                    f"{stem}_{name}.png"
                )

                output_path = (
                    output_class / output_name
                )

                if cv2.imwrite(
                    str(output_path),
                    variant
                ):
                    class_output += 1
                    total_output += 1

        print(f"Generated images: {class_output}")

    print()
    print("=" * 55)
    print(f"Total input images: {total_input}")
    print(f"Total generated images: {total_output}")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 55)


if __name__ == "__main__":
    main()
