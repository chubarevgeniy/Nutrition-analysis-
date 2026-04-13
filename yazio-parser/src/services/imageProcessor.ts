import Tesseract from 'tesseract.js';

export interface BBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const extractTextWithBoundingBoxes = async (imageFile: File | string): Promise<BBox[]> => {
  const worker = await Tesseract.createWorker('eng');

  try {
    const { data } = await worker.recognize(imageFile);

    // We want word-level or line-level bounding boxes.
    // In Tesseract.js, `data` has a `words` property that gives us word-level bounding boxes.
    // Need to handle if data.words is absent.
    const words = (data as any).words || [];
    const bboxes: BBox[] = words.map((word: any) => ({
      text: word.text,
      x: word.bbox.x0,
      y: word.bbox.y0,
      width: word.bbox.x1 - word.bbox.x0,
      height: word.bbox.y1 - word.bbox.y0,
    }));

    console.log("OCR Extracted Words count:", words.length);

    return bboxes;
  } catch (err) {
    console.error("Tesseract recognition error:", err);
    throw err;
  } finally {
    await worker.terminate();
  }
};
