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
    const { data } = await worker.recognize(imageFile, {}, { blocks: true });

    // We want word-level bounding boxes.
    // Extract words from the blocks hierarchy.
    const words: any[] = [];
    if (data.blocks) {
      for (const block of data.blocks) {
        if (!block.paragraphs) continue;
        for (const para of block.paragraphs) {
          if (!para.lines) continue;
          for (const line of para.lines) {
            if (!line.words) continue;
            for (const word of line.words) {
              words.push(word);
            }
          }
        }
      }
    }

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
