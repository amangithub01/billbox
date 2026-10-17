import cv2
import numpy as np
from pathlib import Path
from typing import Tuple

def load_image(path: Path) -> np.ndarray:
    """Load an image from a file path using OpenCV.
    Returns a BGR numpy array.
    """
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")
    return img

def auto_rotate(img: np.ndarray) -> np.ndarray:
    """Detect dominant text orientation and rotate the image accordingly.
    A simple heuristic based on OpenCV's moments is used; for more robust
    detection a dedicated OCR orientation model would be preferable.
    """
    # Convert to grayscale and compute edges
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
    if lines is None:
        return img
    angles = []
    for rho, theta in lines[:, 0]:
        angle = (theta * 180) / np.pi
        angles.append(angle)
    median_angle = np.median(angles)
    # Rotate if angle deviates from 0 or 90 degrees by more than 10°
    if median_angle > 10 and median_angle < 80:
        # Rotate to make text horizontal
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle - 90, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return rotated
    return img

def deskew(img: np.ndarray) -> np.ndarray:
    """Deskew the image by estimating the skew angle via the projection profile.
    This function works best on binary images; we convert to grayscale and
    threshold before estimating.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(bw > 0))
    if len(coords) == 0:
        return img
    rect = cv2.minAreaRect(coords)
    angle = rect[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    deskewed = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return deskewed

def resize_max_dim(img: np.ndarray, max_dim: int = 1280) -> np.ndarray:
    """Resize the image so that its longest side equals max_dim while keeping aspect ratio.
    """
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img
    scale = max_dim / float(max(h, w))
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized

def enhance_contrast(img: np.ndarray) -> np.ndarray:
    """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to boost contrast.
    Works on the V channel of HSV color space.
    """
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    v_enhanced = clahe.apply(v)
    hsv_enhanced = cv2.merge([h, s, v_enhanced])
    enhanced = cv2.cvtColor(hsv_enhanced, cv2.COLOR_HSV2BGR)
    return enhanced

def preprocess_image(path: Path) -> Tuple[np.ndarray, dict]:
    """Full preprocessing pipeline.
    Returns the processed image and a dict with metadata about each step.
    """
    img = load_image(path)
    steps = {}
    img = auto_rotate(img)
    steps["auto_rotate"] = True
    img = deskew(img)
    steps["deskew"] = True
    img = resize_max_dim(img, max_dim=1280)
    steps["resize"] = True
    img = enhance_contrast(img)
    steps["contrast"] = True
    return img, steps
