'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Symbol {
  id: number;
  symbol: string;
  name: string;
}

interface Timeframe {
  id: number;
  name: string;
  minutes: number;
}

export default function NewStrategyPage() {
  const router = useRouter();
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    symbolId: '',
    timeframeId: '',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    count: 5,
    lotSize: 0.1,
    stopLossPips: 50,
    takeProfitPips: 100,
    maxDrawdownPercent: 20,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/strategies/symbols').then(r => r.json()),
      fetch('/api/strategies/timeframes').then(r => r.json()),
    ]).then(([symbolsData, timeframesData]) => {
      setSymbols(symbolsData);
      setTimeframes(timeframesData);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/strategies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbolId: parseInt(formData.symbolId),
          timeframeId: parseInt(formData.timeframeId),
          startDate: formData.startDate,
          endDate: formData.endDate,
          count: formData.count,
          riskSettings: {
            lotSize: formData.lotSize,
            stopLossPips: formData.stopLossPips,
            takeProfitPips: formData.takeProfitPips,
            maxDrawdownPercent: formData.maxDrawdownPercent,
          },
        }),
      });

      if (response.ok) {
        router.push('/strategies');
      } else {
        alert('Error generating strategies');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating strategies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Generate Trading Strategies</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Symbol</label>
          <select
            value={formData.symbolId}
            onChange={e => setFormData({ ...formData, symbolId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select a symbol</option>
            {symbols.map(s => (
              <option key={s.id} value={s.id}>
                {s.symbol} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Timeframe</label>
          <select
            value={formData.timeframeId}
            onChange={e => setFormData({ ...formData, timeframeId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select a timeframe</option>
            {timeframes.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Number of Strategies to Generate</label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.count}
            onChange={e => setFormData({ ...formData, count: parseInt(e.target.value) })}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Risk Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lot Size</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.lotSize}
                onChange={e => setFormData({ ...formData, lotSize: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Drawdown %</label>
              <input
                type="number"
                min="1"
                value={formData.maxDrawdownPercent}
                onChange={e => setFormData({ ...formData, maxDrawdownPercent: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stop Loss (pips)</label>
              <input
                type="number"
                min="1"
                value={formData.stopLossPips}
                onChange={e => setFormData({ ...formData, stopLossPips: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Take Profit (pips)</label>
              <input
                type="number"
                min="1"
                value={formData.takeProfitPips}
                onChange={e => setFormData({ ...formData, takeProfitPips: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Strategies'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/strategies')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
