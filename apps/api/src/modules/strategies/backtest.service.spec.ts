import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BacktestService } from './backtest.service';
import type { DatabaseService } from '../../common/database.service';
import type { MarketDataService, PriceBar } from './market-data.service';
import type { StrategiesService, Strategy } from './strategies.service';
import { IndicatorType } from './dto/strategy-config.dto';
import type { StrategyConfig, BacktestMetrics } from './dto/strategy-config.dto';

type BacktestCalculations = {
  calculateSMA: (bars: PriceBar[], index: number, period: number) => number;
  calculateRSI: (bars: PriceBar[], index: number, period: number) => number;
  simulateStrategy: (bars: PriceBar[], config: StrategyConfig, initialBalance: number) => BacktestMetrics;
};

function makeBar(close: number, timestamp?: Date): PriceBar {
  return {
    timestamp: timestamp ?? new Date(),
    open: close,
    high: close + 0.001,
    low: close - 0.001,
    close,
    volume: 100,
  };
}

describe('BacktestService', () => {
  const mockQuery = vi.fn();
  const mockDb = { pool: { query: mockQuery } } as unknown as DatabaseService;
  const mockGetHistoricalData = vi.fn();
  const mockMarketData = { getHistoricalData: mockGetHistoricalData } as unknown as MarketDataService;
  const mockGetById = vi.fn();
  const mockStrategies = { getById: mockGetById } as unknown as StrategiesService;

  let service: BacktestService;
  let calculations: BacktestCalculations;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BacktestService(mockDb, mockMarketData, mockStrategies);
    calculations = service as unknown as BacktestCalculations;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateSMA', () => {
    it('should calculate simple moving average correctly', () => {
      const bars = [makeBar(10), makeBar(20), makeBar(30)];
      const result = calculations.calculateSMA(bars, 2, 3);
      expect(result).toBe(20);
    });

    it('should return current close when index is less than period', () => {
      const bars = [makeBar(10), makeBar(20)];
      const result = calculations.calculateSMA(bars, 0, 5);
      expect(result).toBe(10);
    });

    it('should use only the last N bars for the average', () => {
      const bars = [makeBar(100), makeBar(10), makeBar(20), makeBar(30)];
      const result = calculations.calculateSMA(bars, 3, 3);
      expect(result).toBe(20);
    });
  });

  describe('calculateRSI', () => {
    it('should return 100 when all changes are gains', () => {
      const bars = [makeBar(10), makeBar(11), makeBar(12), makeBar(13), makeBar(14),
                     makeBar(15), makeBar(16), makeBar(17), makeBar(18), makeBar(19),
                     makeBar(20), makeBar(21), makeBar(22), makeBar(23), makeBar(24)];
      const result = calculations.calculateRSI(bars, 14, 14);
      expect(result).toBe(100);
    });

    it('should return 50 when index is less than period', () => {
      const bars = [makeBar(10), makeBar(11)];
      const result = calculations.calculateRSI(bars, 1, 14);
      expect(result).toBe(50);
    });

    it('should return a value between 0 and 100 for mixed data', () => {
      const bars: PriceBar[] = [];
      let price = 100;
      for (let i = 0; i < 20; i++) {
        price += i % 2 === 0 ? 1 : -0.5;
        bars.push(makeBar(price));
      }
      const result = calculations.calculateRSI(bars, 19, 14);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });
  });

  describe('simulateStrategy', () => {
    const baseConfig: StrategyConfig = {
      indicators: [{ type: IndicatorType.SMA, params: { period: 20 } }],
      entryRules: [],
      riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 },
    };

    it('should return zero trades for insufficient data', () => {
      const bars = Array.from({ length: 10 }, (_, i) => makeBar(1.1 + i * 0.001));
      const result = calculations.simulateStrategy(bars, baseConfig, 10000);
      expect(result.totalTrades).toBe(0);
      expect(result.finalBalance).toBe(10000);
    });

    it('should track max drawdown', () => {
      const bars = Array.from({ length: 100 }, (_, i) => makeBar(1.1 + Math.sin(i * 0.1) * 0.01));
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      const result = calculations.simulateStrategy(bars, baseConfig, 10000);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
      vi.restoreAllMocks();
    });

    it('should preserve initial balance when no trades occur', () => {
      const bars = Array.from({ length: 60 }, () => makeBar(1.1));
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const configNoIndicators: StrategyConfig = {
        indicators: [],
        entryRules: [],
        riskSettings: baseConfig.riskSettings,
      };
      const result = calculations.simulateStrategy(bars, configNoIndicators, 10000);
      expect(result.finalBalance).toBe(10000);
      vi.restoreAllMocks();
    });
  });

  describe('runBacktest', () => {
    it('should fetch strategy and market data, then save results', async () => {
      const strategy: Strategy = {
        id: 1,
        name: 'Test',
        symbolId: 1,
        timeframeId: 5,
        config: {
          indicators: [],
          entryRules: [],
          riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 },
        },
        createdAt: new Date(),
      };
      const bars = Array.from({ length: 60 }, (_, i) => makeBar(1.1 + i * 0.0001));

      mockGetById.mockResolvedValue(strategy);
      mockGetHistoricalData.mockResolvedValue(bars);
      mockQuery.mockResolvedValue({ rows: [{ id: 42 }] });
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const result = await service.runBacktest({
        strategyId: 1,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        initialBalance: 10000,
      });

      expect(mockGetById).toHaveBeenCalledWith(1);
      expect(mockGetHistoricalData).toHaveBeenCalledWith(1, 5, '2024-01-01', '2024-06-30');
      expect(mockQuery).toHaveBeenCalled();
      expect(result.backtestId).toBe(42);
      expect(result.finalBalance).toBe(10000);
      vi.restoreAllMocks();
    });
  });
});
