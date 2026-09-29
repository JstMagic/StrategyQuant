import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketDataService } from './market-data.service';
import type { DatabaseService } from '../../common/database.service';

describe('MarketDataService', () => {
  const mockQuery = vi.fn();
  const mockDb = { pool: { query: mockQuery } } as unknown as DatabaseService;
  let service: MarketDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MarketDataService(mockDb);
  });

  describe('getMarkets', () => {
    it('should return markets from database', async () => {
      const markets = [
        { id: 1, name: 'Forex', description: 'Foreign Exchange Market' },
        { id: 2, name: 'Crypto', description: 'Cryptocurrency Market' },
      ];
      mockQuery.mockResolvedValue({ rows: markets });

      const result = await service.getMarkets();
      expect(result).toEqual(markets);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, name, description FROM markets ORDER BY name'
      );
    });
  });

  describe('getSymbols', () => {
    it('should return all symbols when no marketId filter', async () => {
      const symbols = [{ id: 1, marketId: 1, symbol: 'EURUSD', name: 'Euro vs US Dollar' }];
      mockQuery.mockResolvedValue({ rows: symbols });

      const result = await service.getSymbols();
      expect(result).toEqual(symbols);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY symbol'),
        []
      );
    });

    it('should filter by marketId when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await service.getSymbols(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE market_id = $1'),
        [1]
      );
    });
  });

  describe('getTimeframes', () => {
    it('should return timeframes ordered by minutes', async () => {
      const timeframes = [{ id: 1, name: 'M1', minutes: 1, mqlConstant: 'PERIOD_M1' }];
      mockQuery.mockResolvedValue({ rows: timeframes });

      const result = await service.getTimeframes();
      expect(result).toEqual(timeframes);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY minutes')
      );
    });
  });

  describe('getHistoricalData', () => {
    it('should return cached data when available', async () => {
      const cachedBars = [
        { timestamp: new Date(), open: 1.1, high: 1.11, low: 1.09, close: 1.105, volume: 500 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: cachedBars });

      const result = await service.getHistoricalData(1, 5, '2024-01-01', '2024-01-31');
      expect(result).toEqual(cachedBars);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should generate and cache synthetic data when no cache exists', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] });

      const result = await service.getHistoricalData(1, 5, '2024-01-01', '2024-01-02');
      expect(result.length).toBeGreaterThan(0);
      expect(mockQuery.mock.calls.length).toBeGreaterThan(1);
    });

    it('should generate bars with valid OHLC structure', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] });

      const result = await service.getHistoricalData(1, 5, '2024-01-01', '2024-01-02');
      for (const bar of result) {
        expect(bar.high).toBeGreaterThanOrEqual(bar.open);
        expect(bar.high).toBeGreaterThanOrEqual(bar.close);
        expect(bar.low).toBeLessThanOrEqual(bar.open);
        expect(bar.low).toBeLessThanOrEqual(bar.close);
        expect(bar.volume).toBeGreaterThan(0);
      }
    });

    it('should generate bars with correct timeframe interval for H1', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] });

      const result = await service.getHistoricalData(1, 5, '2024-01-01', '2024-01-02');
      if (result.length >= 2) {
        const diff = result[1]!.timestamp.getTime() - result[0]!.timestamp.getTime();
        expect(diff).toBe(60 * 60 * 1000);
      }
    });
  });
});
