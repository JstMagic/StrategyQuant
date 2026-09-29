'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Strategy {
  id: number;
  name: string;
  symbolId: number;
  timeframeId: number;
  createdAt: string;
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strategies')
      .then(res => res.json())
      .then(data => {
        setStrategies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading strategies:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24">
        <p>Loading strategies...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Trading Strategies</h1>
        <Link
          href="/strategies/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Create New Strategy
        </Link>
      </div>

      {strategies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No strategies yet. Create your first one!</p>
          <Link
            href="/strategies/new"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Get Started
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map(strategy => (
            <Link
              key={strategy.id}
              href={`/strategies/${strategy.id}`}
              className="block rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <h2 className="text-xl font-semibold mb-2">{strategy.name}</h2>
              <p className="text-sm text-gray-600">
                Created: {new Date(strategy.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Symbol ID: {strategy.symbolId} | Timeframe ID: {strategy.timeframeId}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
