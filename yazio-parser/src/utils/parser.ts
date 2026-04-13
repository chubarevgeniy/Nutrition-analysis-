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

export interface MetricDataset {
  id: string;
  name: string;
  data: ParsedRow[];
}

// Known months to help identify date rows
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  'сегодня', 'вчера'
];

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

      // strip time patterns (e.g. 08:00)
      let cleanedValueStr = valItems.map(v => v.text).join(' ');
      cleanedValueStr = cleanedValueStr.replace(/\b\d{1,2}:\d{2}\b/g, '');

      // We need to distinguish between thousand separators (e.g., 2,573 kcal)
      // and decimal separators (e.g., 75,5 kg).
      // Heuristic: If comma is followed by exactly 3 digits and then end-of-number,
      // it's likely a thousands separator (so strip it). Otherwise, it's a decimal (replace with dot).
      cleanedValueStr = cleanedValueStr.replace(/,(\d{3})(?!\d)/g, '$1'); // thousands
      cleanedValueStr = cleanedValueStr.replace(/,/g, '.'); // remaining are decimals

      const valueStr = valItems.map(v => v.text).join(' ');

      const match = cleanedValueStr.match(/\b(\d+(\.\d+)?)\b/);
      const value = match ? parseFloat(match[1]) : null;

      if (dateStr.trim() && value !== null && !isNaN(value)) {
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
