from pathlib import Path

ROOT = Path("data/dataset")

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
}


def main():
    print()
    print("========================================")
    print("       BLUESENTINEL DATASET REPORT")
    print("========================================")

    total = 0

    if not ROOT.exists():
        print("Dataset directory does not exist.")
        return

    for class_dir in sorted(ROOT.iterdir()):
        if not class_dir.is_dir():
            continue

        count = sum(
            1
            for file in class_dir.iterdir()
            if file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
        )

        total += count

        print(f"{class_dir.name:15} : {count:5} images")

    print("----------------------------------------")
    print(f"{'TOTAL':15} : {total:5} images")
    print("========================================")


if __name__ == "__main__":
    main()
