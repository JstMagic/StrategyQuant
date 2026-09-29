import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportService } from './export.service';
import type { StrategiesService, Strategy } from './strategies.service';
import { IndicatorType } from './dto/strategy-config.dto';

describe('ExportService', () => {
  const mockGetById = vi.fn();
  const mockStrategies = { getById: mockGetById } as unknown as StrategiesService;
  let service: ExportService;

  const testStrategy: Strategy = {
    id: 1,
    name: 'Test Strategy',
    symbolId: 1,
    timeframeId: 5,
    config: {
      indicators: [
        { type: IndicatorType.SMA, params: { period: 20 } },
        { type: IndicatorType.RSI, params: { period: 14 } },
      ],
      entryRules: [
        { indicator: IndicatorType.RSI, condition: 'below', value: 30 },
      ],
      riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 },
    },
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExportService(mockStrategies);
    mockGetById.mockResolvedValue(testStrategy);
  });

  describe('exportStrategy', () => {
    it('should fetch the strategy by id', async () => {
      await service.exportStrategy(1, 'mq4');
      expect(mockGetById).toHaveBeenCalledWith(1);
    });

    it('should generate MQ4 code with correct filename', async () => {
      const result = await service.exportStrategy(1, 'mq4');
      expect(result.filename).toBe('Test_Strategy.mq4');
      expect(result.code).toContain('#property strict');
      expect(result.code).toContain('input double LotSize = 0.1');
      expect(result.code).toContain('input int StopLossPips = 50');
      expect(result.code).toContain('input int TakeProfitPips = 100');
    });

    it('should generate MQ5 code with correct filename', async () => {
      const result = await service.exportStrategy(1, 'mq5');
      expect(result.filename).toBe('Test_Strategy.mq5');
      expect(result.code).toContain('#include <Trade\\Trade.mqh>');
      expect(result.code).toContain('CTrade trade');
    });

    it('should include SMA indicator logic in MQ4 output', async () => {
      const result = await service.exportStrategy(1, 'mq4');
      expect(result.code).toContain('iMA(NULL, 0, 20, 0, MODE_SMA, PRICE_CLOSE, 0)');
    });

    it('should include RSI indicator logic in MQ4 output', async () => {
      const result = await service.exportStrategy(1, 'mq4');
      expect(result.code).toContain('iRSI(NULL, 0, 14, PRICE_CLOSE, 0)');
    });

    it('should include SMA indicator logic in MQ5 output', async () => {
      const result = await service.exportStrategy(1, 'mq5');
      expect(result.code).toContain('iMA(Symbol(), PERIOD_CURRENT, 20, 0, MODE_SMA, PRICE_CLOSE)');
    });

    it('should include RSI indicator logic in MQ5 output', async () => {
      const result = await service.exportStrategy(1, 'mq5');
      expect(result.code).toContain('iRSI(Symbol(), PERIOD_CURRENT, 14, PRICE_CLOSE)');
    });

    it('should include strategy name in generated code', async () => {
      const result = await service.exportStrategy(1, 'mq4');
      expect(result.code).toContain('Test Strategy');
    });

    it('should sanitize filename by replacing non-alphanumeric chars', async () => {
      const specialStrategy: Strategy = {
        ...testStrategy,
        name: 'My Strategy (v2.0)!',
      };
      mockGetById.mockResolvedValue(specialStrategy);
      const result = await service.exportStrategy(1, 'mq4');
      expect(result.filename).toBe('My_Strategy__v2_0__.mq4');
    });

    it('should generate code with OnInit and OnTick functions', async () => {
      const mq4 = await service.exportStrategy(1, 'mq4');
      expect(mq4.code).toContain('int OnInit()');
      expect(mq4.code).toContain('void OnTick()');

      const mq5 = await service.exportStrategy(1, 'mq5');
      expect(mq5.code).toContain('int OnInit()');
      expect(mq5.code).toContain('void OnTick()');
    });
  });
});
