import React, { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { extractTextWithBoundingBoxes } from '../services/imageProcessor';
import { parseRowsToMetrics } from '../utils/parser';
import type { ParsedRow } from '../utils/parser';

interface UploaderProps {
  onDataParsed: (data: ParsedRow[]) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onDataParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const bboxes = await extractTextWithBoundingBoxes(file);
      const parsed = parseRowsToMetrics(bboxes);
      setPreviewData(parsed);
    } catch (error) {
      console.error("OCR Error: ", error);
      alert("Failed to parse image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRowChange = (index: number, field: keyof ParsedRow, value: string) => {
    const newData = [...previewData];
    if (field === 'value') {
      newData[index].value = parseFloat(value) || 0;
      newData[index].valueStr = value;
    } else {
      newData[index][field] = value as never;
    }
    setPreviewData(newData);
  };

  const handleConfirm = () => {
    onDataParsed(previewData);
    setPreviewData([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-zinc-900 rounded-lg shadow border border-zinc-800">
      {!previewData.length && !isProcessing && (
        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:bg-zinc-800 hover:border-blue-500 transition-colors">
          <UploadCloud className="w-10 h-10 text-zinc-400 mb-2" />
          <span className="text-zinc-300">Click or drag a screenshot to upload</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center h-48">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <span className="text-zinc-300">Processing image via OCR... This may take a minute.</span>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Verify Extracted Data</h3>
          <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
            {previewData.map((row, i) => (
              <div key={i} className="flex gap-2 items-center bg-zinc-800 p-2 rounded">
                <input
                  type="text"
                  value={row.dateStr}
                  onChange={(e) => handleRowChange(i, 'dateStr', e.target.value)}
                  className="flex-1 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  value={row.value ?? ''}
                  onChange={(e) => handleRowChange(i, 'value', e.target.value)}
                  className="w-32 bg-zinc-700 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setPreviewData([])}
              className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Confirm Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
