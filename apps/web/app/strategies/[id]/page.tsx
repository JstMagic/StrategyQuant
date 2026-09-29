'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface IndicatorConfig {
  type: string;
  params: Record<string, number>;
}

interface EntryRule {
  indicator: string;
  condition: string;
  value: number;
}

interface RiskSettings {
  lotSize: number;
  stopLossPips: number;
  takeProfitPips: number;
  maxDrawdownPercent: number;
}

interface StrategyConfig {
  indicators: IndicatorConfig[];
  entryRules: EntryRule[];
  riskSettings: RiskSettings;
}

interface Strategy {
  id: number;
  name: string;
  symbolId: number;
  timeframeId: number;
  config: StrategyConfig;
  createdAt: string;
}

interface BacktestResult {
  id: number;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [backtesting, setBacktesting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3001/strategies/${strategyId}`).then(r => r.json()),
      fetch(`http://localhost:3001/strategies/${strategyId}/backtests`).then(r => r.json()),
    ]).then(([strategyData, backtestsData]) => {
      setStrategy(strategyData);
      setBacktests(backtestsData);
      setLoading(false);
    });
  }, [strategyId]);

  const runBacktest = async () => {
    setBacktesting(true);
    try {
      const response = await fetch('http://localhost:3001/strategies/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: parseInt(strategyId),
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          initialBalance: 10000,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBacktests([result, ...backtests]);
      }
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setBacktesting(false);
    }
  };

  const exportStrategy = async (format: 'mq4' | 'mq5') => {
    setExporting(true);
    try {
      const response = await fetch('http://localhost:3001/strategies/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: parseInt(strategyId),
          format,
        }),
      });

      if (response.ok) {
        const { code, filename } = await response.json();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading || !strategy) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24">
        <p>Loading strategy...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-8">
        <button
          onClick={() => router.push('/strategies')}
          className="text-blue-600 hover:text-blue-500 mb-4"
        >
          ← Back to Strategies
        </button>
        <h1 className="text-4xl font-bold tracking-tight">{strategy.name}</h1>
        <p className="text-gray-600 mt-2">
          Created: {new Date(strategy.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Strategy Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Symbol ID:</strong> {strategy.symbolId}</p>
            <p><strong>Timeframe ID:</strong> {strategy.timeframeId}</p>
            <p><strong>Indicators:</strong> {strategy.config.indicators?.length || 0}</p>
            <p><strong>Entry Rules:</strong> {strategy.config.entryRules?.length || 0}</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={runBacktest}
              disabled={backtesting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {backtesting ? 'Running Backtest...' : 'Run Backtest'}
            </button>
            <button
              onClick={() => exportStrategy('mq4')}
              disabled={exporting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Export as MQ4
            </button>
            <button
              onClick={() => exportStrategy('mq5')}
              disabled={exporting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Export as MQ5
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Backtest Results</h2>
        {backtests.length === 0 ? (
          <p className="text-gray-600">No backtest results yet. Run a backtest to see results.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Date Range</th>
                  <th className="text-right py-2">Initial</th>
                  <th className="text-right py-2">Final</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Win Rate</th>
                  <th className="text-right py-2">Trades</th>
                  <th className="text-right py-2">Max DD</th>
                </tr>
              </thead>
              <tbody>
                {backtests.map(bt => (
                  <tr key={bt.id} className="border-b">
                    <td className="py-2">
                      {new Date(bt.startDate).toLocaleDateString()} - {new Date(bt.endDate).toLocaleDateString()}
                    </td>
                    <td className="text-right">${bt.initialBalance.toFixed(2)}</td>
                    <td className="text-right">${bt.finalBalance.toFixed(2)}</td>
                    <td className={`text-right ${bt.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${bt.totalProfit.toFixed(2)}
                    </td>
                    <td className="text-right">{(bt.winRate * 100).toFixed(1)}%</td>
                    <td className="text-right">{bt.totalTrades}</td>
                    <td className="text-right">{bt.maxDrawdown.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
