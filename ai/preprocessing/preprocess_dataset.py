from pathlib import Path
import cv2
import json

PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_DIR = PROJECT_ROOT / "data" / "dataset"
OUTPUT_DIR = PROJECT_ROOT / "data" / "preprocessed"
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
        else:
            raise KeyError(
                "classes.json must contain either "
                "'folder' or 'name' for each class."
            )

    return classes


def preprocess_image(image):
    # Step 1: Resize
    resized = cv2.resize(
        image,
        (512, 512),
        interpolation=cv2.INTER_AREA
    )

    # Step 2: Grayscale
    gray = cv2.cvtColor(
        resized,
        cv2.COLOR_BGR2GRAY
    )

    # Step 3: Denoising
    denoised = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )

    # Step 4: CLAHE contrast enhancement
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(denoised)

    return enhanced


def main():
    classes = load_classes()

    total = 0

    print()
    print("BlueSentinel - Sonar Preprocessing")
    print("=" * 50)
    print("Pipeline:")
    print("Resize -> Grayscale -> Denoise -> CLAHE")
    print("=" * 50)

    for class_name in classes:

        input_class = INPUT_DIR / class_name
        output_class = OUTPUT_DIR / class_name

        output_class.mkdir(
            parents=True,
            exist_ok=True
        )

        if not input_class.exists():
            print(f"\n[SKIP] {class_name}: folder not found")
            continue

        images = [
            p for p in input_class.iterdir()
            if p.is_file()
            and p.suffix.lower() in IMAGE_EXTENSIONS
        ]

        print(f"\n[{class_name}]")
        print(f"Input images: {len(images)}")

        processed = 0

        for image_path in images:

            image = cv2.imread(
                str(image_path),
                cv2.IMREAD_COLOR
            )

            if image is None:
                print(
                    f"  [ERROR] Cannot read: "
                    f"{image_path.name}"
                )
                continue

            processed_image = preprocess_image(image)

            output_path = output_class / image_path.name

            if cv2.imwrite(
                str(output_path),
                processed_image
            ):
                processed += 1
                total += 1
                print(
                    f"  [OK] {image_path.name}"
                )
            else:
                print(
                    f"  [ERROR] Cannot write: "
                    f"{output_path.name}"
                )

        print(f"Processed: {processed}")

    print()
    print("=" * 50)
    print(f"Total processed images: {total}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
