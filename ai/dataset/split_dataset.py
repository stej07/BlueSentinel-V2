from pathlib import Path
import random
import shutil

PROJECT_ROOT = Path(__file__).resolve().parents[2]

SOURCE = PROJECT_ROOT / "data" / "dataset"
OUTPUT = PROJECT_ROOT / "data" / "splits"

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

SEED = 42

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp",
}

random.seed(SEED)


def collect_images(folder):
    return sorted(
        [
            file
            for file in folder.iterdir()
            if file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
        ]
    )


def split_class(class_dir):

    images = collect_images(class_dir)

    if not images:
        print(f"[SKIP] {class_dir.name}: no images found")
        return

    random.shuffle(images)

    total = len(images)

    # For very small demo classes, keep at least one image
    # in training and report that validation/test are unavailable.
    if total < 3:
        train_images = images
        val_images = []
        test_images = []

    else:
        train_count = max(1, round(total * TRAIN_RATIO))
        val_count = max(1, round(total * VAL_RATIO))

        # Ensure at least one test image when enough samples exist
        test_count = total - train_count - val_count

        if test_count < 1:
            test_count = 1
            if train_count > 1:
                train_count -= 1
            else:
                val_count -= 1

        train_images = images[:train_count]
        val_images = images[
            train_count:train_count + val_count
        ]
        test_images = images[
            train_count + val_count:
        ]

    print()
    print(f"Class: {class_dir.name}")
    print(f"Total: {total}")
    print(f"Train: {len(train_images)}")
    print(f"Validation: {len(val_images)}")
    print(f"Test: {len(test_images)}")

    for split_name, split_images in [
        ("train", train_images),
        ("val", val_images),
        ("test", test_images),
    ]:

        destination = (
            OUTPUT /
            split_name /
            class_dir.name
        )

        destination.mkdir(
            parents=True,
            exist_ok=True
        )

        for image in split_images:

            destination_file = (
                destination /
                image.name
            )

            shutil.copy2(
                image,
                destination_file
            )


def main():

    if not SOURCE.exists():
        raise FileNotFoundError(
            f"Dataset directory does not exist: {SOURCE}"
        )

    OUTPUT.mkdir(
        parents=True,
        exist_ok=True
    )

    classes = sorted(
        [
            directory
            for directory in SOURCE.iterdir()
            if directory.is_dir()
        ]
    )

    if not classes:
        print("No dataset classes found.")
        return

    print()
    print("BlueSentinel - Dataset Split")
    print("=" * 50)
    print("Train: 70%")
    print("Validation: 15%")
    print("Test: 15%")
    print("Random seed:", SEED)
    print("=" * 50)

    for class_dir in classes:
        split_class(class_dir)

    print()
    print("=" * 50)
    print("Dataset split completed.")
    print("Output:", OUTPUT)
    print("=" * 50)


if __name__ == "__main__":
    main()
