import { useState } from 'react';
import { Uploader } from './components/Uploader';
import { Dashboard } from './components/Dashboard';
import type { ParsedRow } from './utils/parser';
import { Activity } from 'lucide-react';

function App() {
  const [timelineData, setTimelineData] = useState<ParsedRow[]>([]);

  const handleDataParsed = (newData: ParsedRow[]) => {
    // In a full app, we might merge data. Here we simply append or replace for now.
    // Let's replace to keep it simple, or user can clear.
    setTimelineData(newData);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        <header className="flex items-center gap-3 border-b border-zinc-800 pb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Yazio Data Extractor</h1>
            <p className="text-zinc-400 text-sm mt-1">Parse long screenshots, analyze trends, and chart your progress.</p>
          </div>
        </header>

        <main className="space-y-8">
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">1. Upload Screenshot</h2>
              <p className="text-zinc-400 text-sm">Upload a continuous screenshot from Yazio. The OCR runs locally in your browser.</p>
            </div>
            <Uploader onDataParsed={handleDataParsed} />
          </section>

          {timelineData.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">2. Analyze Data</h2>
                  <p className="text-zinc-400 text-sm">Apply smoothing windows to understand the true trend of your metrics.</p>
                </div>
                <button
                  onClick={() => setTimelineData([])}
                  className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded border border-red-900 hover:bg-red-900/50 transition-colors text-sm"
                >
                  Clear Data
                </button>
              </div>
              <Dashboard data={timelineData} />
            </section>
          )}
        </main>

      </div>
    </div>
  );
}

export default App;
