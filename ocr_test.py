import pytesseract
from PIL import Image
import sys

def test_ocr(image_path):
    print(f"Testing OCR on {image_path}")
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    print("--- OCR Output ---")
    print(text)
    print("------------------")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_ocr(sys.argv[1])
    else:
        print("Usage: python ocr_test.py <image_path>")
