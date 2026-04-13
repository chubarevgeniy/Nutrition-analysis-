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
import type { MetricDataset } from '../utils/parser';

interface DashboardProps {
  datasets: MetricDataset[];
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

// Colors for different metrics
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const Dashboard: React.FC<DashboardProps> = ({ datasets }) => {
  const [windowSize, setWindowSize] = useState(7);
  const [smoothMode, setSmoothMode] = useState<'median' | 'average'>('median');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({});

  // Calculated metrics state
  const [initialWeight, setInitialWeight] = useState<number>(80);
  const [baseTDEE, setBaseTDEE] = useState<number>(2000);
  const [showNetCalories, setShowNetCalories] = useState(false);
  const [showTheoreticalWeight, setShowTheoreticalWeight] = useState(false);

  // Initialize visibility
  React.useEffect(() => {
    const newVis: Record<string, boolean> = { ...visibleMetrics };
    let changed = false;
    datasets.forEach(ds => {
      if (newVis[ds.id] === undefined) {
        newVis[ds.id] = true;
        changed = true;
      }
    });
    if (changed) setVisibleMetrics(newVis);
  }, [datasets]);

  const toggleMetric = (id: string) => {
    setVisibleMetrics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const chartData = useMemo(() => {
    const merged: Record<string, any> = {};

    // Collect all unique dates and map raw values
    datasets.forEach(ds => {
      // Reverse to chronological
      const chronological = [...ds.data].reverse();
      chronological.forEach(row => {
        if (!merged[row.dateStr]) {
          merged[row.dateStr] = { date: row.dateStr };
        }
        merged[row.dateStr][`${ds.id}-raw`] = row.value;
      });
    });

    // The data is pushed sequentially during upload, so we don't rely on alphabetical string sorting for dates.
    let dataArray = Object.values(merged);

    // Calculate smoothed values per dataset
    datasets.forEach(ds => {
      const rawValues = dataArray.map(row => row[`${ds.id}-raw`] ?? null);

      dataArray.forEach((row, i) => {
        const startIdx = Math.max(0, i - windowSize + 1);
        const windowSlice = rawValues.slice(startIdx, i + 1).filter(v => v !== null) as number[];

        if (windowSlice.length > 0) {
          const smoothedValue = smoothMode === 'median'
            ? computeMedian(windowSlice)
            : computeAverage(windowSlice);
          row[`${ds.id}-smoothed`] = parseFloat(smoothedValue.toFixed(2));
        }
      });
    });

    // Calculate Net Calories
    if (showNetCalories) {
      const fatDs = datasets.find(d => d.name === 'Жиры');
      const carbsDs = datasets.find(d => d.name === 'Углеводы');
      const proteinDs = datasets.find(d => d.name === 'Белки');

      dataArray.forEach(row => {
        const f = fatDs ? (row[`${fatDs.id}-raw`] || 0) : 0;
        const c = carbsDs ? (row[`${carbsDs.id}-raw`] || 0) : 0;
        const p = proteinDs ? (row[`${proteinDs.id}-raw`] || 0) : 0;

        if (f > 0 || c > 0 || p > 0) {
          const net = (f * 9) + (c * 4 * 0.85) + (p * 4 * 0.75);
          row['calculated-net-calories'] = parseFloat(net.toFixed(2));
        }
      });
    }

    // Calculate Theoretical Weight
    if (showTheoreticalWeight) {
      const calDs = datasets.find(d => d.name === 'Калории');
      let currentTheoreticalWeight = initialWeight;

      dataArray.forEach(row => {
        const cals = calDs ? row[`${calDs.id}-raw`] : null;
        if (cals !== null && cals !== undefined) {
          // (TDEE - Calories) / 7700 = weight change in kg
          const diff = baseTDEE - cals;
          const weightChange = diff / 7700;
          currentTheoreticalWeight -= weightChange; // subtract diff
        }
        row['calculated-theoretical-weight'] = parseFloat(currentTheoreticalWeight.toFixed(2));
      });
    }

    return dataArray;
  }, [datasets, windowSize, smoothMode, showNetCalories, showTheoreticalWeight, initialWeight, baseTDEE]);

  if (!datasets.length) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-zinc-900 rounded-lg shadow border border-zinc-800">
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-xl font-bold text-zinc-100">Analytics Dashboard</h2>

          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400 mb-1">Window Size (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={windowSize}
                onChange={(e) => setWindowSize(parseInt(e.target.value) || 1)}
                className="bg-zinc-800 text-zinc-100 px-3 py-1.5 rounded border border-zinc-700 outline-none w-24"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800 p-4 rounded-lg">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Metrics Visibility</h3>
            <div className="flex flex-wrap gap-2">
              {datasets.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => toggleMetric(ds.id)}
                  className={`px-2 py-1 text-xs rounded border ${
                    visibleMetrics[ds.id]
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-zinc-700 border-zinc-600 text-zinc-400'
                  }`}
                >
                  {ds.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Calculated Metrics</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={showNetCalories}
                  onChange={e => setShowNetCalories(e.target.checked)}
                  className="accent-blue-500"
                />
                Чистые калории (Net Calories TEF)
              </label>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={showTheoreticalWeight}
                  onChange={e => setShowTheoreticalWeight(e.target.checked)}
                  className="accent-blue-500"
                />
                Теоретический вес (Theoretical Weight)
              </div>
              {showTheoreticalWeight && (
                <div className="flex gap-2 ml-6">
                  <input
                    type="number"
                    value={initialWeight}
                    onChange={e => setInitialWeight(parseFloat(e.target.value) || 0)}
                    placeholder="Initial Wt"
                    className="bg-zinc-700 text-xs px-2 py-1 rounded w-20 outline-none"
                    title="Initial Weight"
                  />
                  <input
                    type="number"
                    value={baseTDEE}
                    onChange={e => setBaseTDEE(parseInt(e.target.value) || 0)}
                    placeholder="TDEE"
                    className="bg-zinc-700 text-xs px-2 py-1 rounded w-20 outline-none"
                    title="Base TDEE"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-96 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickMargin={10} />
            <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={12} domain={['auto', 'auto']} />
            <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={12} domain={['auto', 'auto']} />

            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              itemStyle={{ color: '#e4e4e7' }}
            />
            <Legend />

            {datasets.filter(ds => visibleMetrics[ds.id]).map((ds, idx) => {
              const color = COLORS[idx % COLORS.length];
              const yAxisId = ds.name === 'Вес' ? 'right' : 'left';
              return (
                <React.Fragment key={ds.id}>
                  <Line
                    yAxisId={yAxisId}
                    type="monotone"
                    dataKey={`${ds.id}-raw`}
                    name={`${ds.name} (Raw)`}
                    stroke={color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.4}
                    dot={{ r: 2, fill: color, fillOpacity: 0.4 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    yAxisId={yAxisId}
                    type="monotone"
                    dataKey={`${ds.id}-smoothed`}
                    name={`${ds.name} (${windowSize}d ${smoothMode})`}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: color }}
                  />
                </React.Fragment>
              );
            })}

            {showNetCalories && (
               <Line
                 yAxisId="left"
                 type="monotone"
                 dataKey="calculated-net-calories"
                 name="Net Calories"
                 stroke="#14b8a6" // teal
                 strokeWidth={2}
                 strokeDasharray="3 3"
                 dot={false}
               />
            )}
            {showTheoreticalWeight && (
               <Line
                 yAxisId="right"
                 type="monotone"
                 dataKey="calculated-theoretical-weight"
                 name="Theoretical Weight"
                 stroke="#f43f5e" // rose
                 strokeWidth={2}
                 strokeDasharray="3 3"
                 dot={false}
               />
            )}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
