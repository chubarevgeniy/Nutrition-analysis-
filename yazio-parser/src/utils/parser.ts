import type { BBox } from '../services/imageProcessor';

export interface ParsedRow {
  dateStr: string;
  valueStr: string;
  value: number | null;
}

// Group bounding boxes into rows based on roughly matching vertical (Y) coordinates.
export const groupRowsByY = (bboxes: BBox[], yThreshold = 20): BBox[][] => {
  const sorted = [...bboxes].sort((a, b) => a.y - b.y);
  const rows: BBox[][] = [];

  let currentRow: BBox[] = [];
  for (const box of sorted) {
    if (currentRow.length === 0) {
      currentRow.push(box);
    } else {
      const avgY = currentRow.reduce((sum, b) => sum + b.y, 0) / currentRow.length;
      if (Math.abs(box.y - avgY) <= yThreshold) {
        currentRow.push(box);
      } else {
        rows.push([...currentRow].sort((a, b) => a.x - b.x));
        currentRow = [box];
      }
    }
  }
  if (currentRow.length > 0) {
    rows.push([...currentRow].sort((a, b) => a.x - b.x));
  }

  return rows;
};

// Known months to help identify date rows
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const isLikelyDate = (text: string) => {
  const lower = text.toLowerCase();
  return MONTHS.some(m => lower.includes(m)) || /^\d{1,2}[\/\-\.]\d{1,2}/.test(text);
};

export const parseRowsToMetrics = (bboxes: BBox[]): ParsedRow[] => {
  const rows = groupRowsByY(bboxes, 25);
  const results: ParsedRow[] = [];

  for (const row of rows) {
    // Attempt to split the row into "left" and "right" parts based on significant X gaps
    // A simpler heuristic: look for Date pattern on the left, value on the right

    // Look for month names or date-like strings
    const hasDate = row.some(b => isLikelyDate(b.text));

    if (hasDate) {
      // Find the date portion (left-most items)
      const dateItems = row.filter(b => b.x < 500); // Date is usually on the left (e.g., x < 500)
      const valItems = row.filter(b => b.x >= 500); // Value is on the right

      const dateStr = dateItems.map(d => d.text).join(' ');
      const valueStr = valItems.map(v => v.text).join(' ').replace(/,/g, ''); // strip commas for parsing

      const match = valueStr.match(/(\d+(\.\d+)?)/);
      const value = match ? parseFloat(match[1]) : null;

      if (dateStr.trim() && value !== null) {
        results.push({
          dateStr: dateStr.trim(),
          valueStr: valueStr.trim(),
          value
        });
      }
    }
  }

  return results;
};
