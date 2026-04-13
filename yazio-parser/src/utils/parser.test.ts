import { describe, it, expect } from 'vitest';
import { groupRowsByY, parseRowsToMetrics } from './parser';

describe('parser logic', () => {
  it('groups boxes by Y correctly', () => {
    const boxes = [
      { text: 'April', x: 61, y: 7, width: 123, height: 54 },
      { text: '13', x: 205, y: 8, width: 58, height: 43 },
      { text: '237', x: 1155, y: 7, width: 97, height: 44 },
      { text: 'kcal', x: 1273, y: 7, width: 102, height: 44 },

      { text: 'April', x: 61, y: 221, width: 123, height: 54 },
      { text: '12', x: 205, y: 221, width: 57, height: 43 },
      { text: '2,573', x: 1104, y: 221, width: 147, height: 48 },
      { text: 'kcal', x: 1273, y: 221, width: 102, height: 44 },
    ];

    const rows = groupRowsByY(boxes);
    expect(rows.length).toBe(2);
    expect(rows[0].map(b => b.text)).toEqual(['April', '13', '237', 'kcal']);
    expect(rows[1].map(b => b.text)).toEqual(['April', '12', '2,573', 'kcal']);
  });

  it('parses valid date/value rows', () => {
    const boxes = [
      { text: 'April', x: 61, y: 7, width: 123, height: 54 },
      { text: '13', x: 205, y: 8, width: 58, height: 43 },
      { text: '237', x: 1155, y: 7, width: 97, height: 44 },
      { text: 'kcal', x: 1273, y: 7, width: 102, height: 44 },

      { text: 'April', x: 61, y: 221, width: 123, height: 54 },
      { text: '12', x: 205, y: 221, width: 57, height: 43 },
      { text: '2,573', x: 1104, y: 221, width: 147, height: 48 },
      { text: 'kcal', x: 1273, y: 221, width: 102, height: 44 },
    ];

    const result = parseRowsToMetrics(boxes);
    expect(result.length).toBe(2);
    expect(result[0].dateStr).toBe('April 13');
    expect(result[0].value).toBe(237);

    expect(result[1].dateStr).toBe('April 12');
    expect(result[1].value).toBe(2573);
  });
});
