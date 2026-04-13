import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { ParsedRow } from '../utils/parser';

interface DashboardProps {
  data: ParsedRow[];
}

// Helper to compute a sliding median
const computeMedian = (arr: number[]) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Helper to compute a sliding average
const computeAverage = (arr: number[]) => {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
};

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [windowSize, setWindowSize] = useState(7);
  const [smoothMode, setSmoothMode] = useState<'median' | 'average'>('median');
  const [metricName, setMetricName] = useState('Calories'); // User can rename

  // Reverse data to have chronological order (oldest to newest)
  const chronologicalData = useMemo(() => {
    return [...data].reverse();
  }, [data]);

  const chartData = useMemo(() => {
    const rawValues = chronologicalData.map((d) => d.value ?? 0);

    return chronologicalData.map((row, i) => {
      const startIdx = Math.max(0, i - windowSize + 1);
      const windowSlice = rawValues.slice(startIdx, i + 1);
      const smoothedValue = smoothMode === 'median'
        ? computeMedian(windowSlice)
        : computeAverage(windowSlice);

      return {
        date: row.dateStr,
        raw: row.value,
        smoothed: parseFloat(smoothedValue.toFixed(2)),
      };
    });
  }, [chronologicalData, windowSize, smoothMode]);

  if (!data.length) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-zinc-900 rounded-lg shadow border border-zinc-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Analytics Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-sm text-zinc-400">Metric Name:</label>
            <input
              type="text"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              className="bg-zinc-800 text-sm text-zinc-100 px-2 py-1 rounded border border-zinc-700 outline-none w-32"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-zinc-400 mb-1">Window Size (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value) || 1)}
              className="bg-zinc-800 text-zinc-100 px-3 py-1.5 rounded border border-zinc-700 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-zinc-400 mb-1">Smoothing</label>
            <select
              value={smoothMode}
              onChange={(e) => setSmoothMode(e.target.value as 'median' | 'average')}
              className="bg-zinc-800 text-zinc-100 px-3 py-1.5 rounded border border-zinc-700 outline-none"
            >
              <option value="median">Median</option>
              <option value="average">Average</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickMargin={10} />
            <YAxis stroke="#a1a1aa" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              itemStyle={{ color: '#e4e4e7' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="raw"
              name={`Daily ${metricName}`}
              stroke="#52525b"
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#52525b' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="smoothed"
              name={`${windowSize}-Day ${smoothMode === 'median' ? 'Median' : 'Avg'} ${metricName}`}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
