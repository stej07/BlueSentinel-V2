import cv2
import numpy as np

def lee_filter(image, size=7):
    image = image.astype(np.float32)

    mean = cv2.blur(image, (size, size))
    mean_sq = cv2.blur(image * image, (size, size))
    variance = np.maximum(mean_sq - mean * mean, 1e-6)

    noise_variance = np.mean(variance)
    weights = variance / (variance + noise_variance + 1e-6)

    result = mean + weights * (image - mean)

    return np.clip(result, 0, 255).astype(np.uint8)


def preprocess_sonar(image):
    if image is None:
        raise ValueError("Invalid sonar image")

    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    filtered = lee_filter(gray)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(filtered)

    return enhanced
