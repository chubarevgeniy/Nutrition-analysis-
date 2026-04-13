import pytesseract
from PIL import Image
import sys

def test_ocr_bbox(image_path):
    print(f"Testing OCR BBox on {image_path}")
    image = Image.open(image_path)
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

    # Group by line_num or just look at words
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        if text:
            x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
            print(f"Text: {text:15} | Y: {y:4} | X: {x:4} | W: {w:3} | H: {h:3}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_ocr_bbox(sys.argv[1])
