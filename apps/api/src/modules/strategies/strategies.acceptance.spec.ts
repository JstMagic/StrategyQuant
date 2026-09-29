import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrategiesController } from './strategies.controller';
import type { StrategiesService, Strategy } from './strategies.service';
import type { MarketDataService } from './market-data.service';
import type { StrategyGeneratorService, GeneratedStrategy } from './strategy-generator.service';
import type { BacktestService } from './backtest.service';
import type { ExportService } from './export.service';
import { IndicatorType } from './dto/strategy-config.dto';
import type { CreateStrategyDto, GenerateStrategiesDto, BacktestRequestDto, ExportStrategyDto } from './dto/strategy-config.dto';

describe('Strategies API Acceptance Tests', () => {
  const mockList = vi.fn();
  const mockGetById = vi.fn();
  const mockCreate = vi.fn();
  const mockGetBacktests = vi.fn();
  const mockStrategiesService = {
    list: mockList,
    getById: mockGetById,
    create: mockCreate,
    getBacktests: mockGetBacktests,
  } as unknown as StrategiesService;

  const mockGetMarkets = vi.fn();
  const mockGetSymbols = vi.fn();
  const mockGetTimeframes = vi.fn();
  const mockMarketDataService = {
    getMarkets: mockGetMarkets,
    getSymbols: mockGetSymbols,
    getTimeframes: mockGetTimeframes,
  } as unknown as MarketDataService;

  const mockGenerateStrategies = vi.fn();
  const mockGeneratorService = {
    generateStrategies: mockGenerateStrategies,
  } as unknown as StrategyGeneratorService;

  const mockRunBacktest = vi.fn();
  const mockBacktestService = {
    runBacktest: mockRunBacktest,
  } as unknown as BacktestService;

  const mockExportStrategy = vi.fn();
  const mockExportService = {
    exportStrategy: mockExportStrategy,
  } as unknown as ExportService;

  let controller: StrategiesController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new StrategiesController(
      mockStrategiesService,
      mockMarketDataService,
      mockGeneratorService,
      mockBacktestService,
      mockExportService,
    );
  });

  describe('Market Data Endpoints', () => {
    it('Given markets exist, When I request markets, Then I receive the market list', async () => {
      const markets = [{ id: 1, name: 'Forex', description: 'Foreign Exchange' }];
      mockGetMarkets.mockResolvedValue(markets);

      const result = await controller.getMarkets();

      expect(result).toEqual(markets);
    });

    it('Given symbols exist, When I request symbols, Then I receive the symbol list', async () => {
      const symbols = [{ id: 1, marketId: 1, symbol: 'EURUSD', name: 'Euro vs USD' }];
      mockGetSymbols.mockResolvedValue(symbols);

      const result = await controller.getSymbols(undefined);

      expect(result).toEqual(symbols);
    });

    it('Given a market filter, When I request symbols for that market, Then I receive filtered symbols', async () => {
      mockGetSymbols.mockResolvedValue([]);

      await controller.getSymbols(1);

      expect(mockGetSymbols).toHaveBeenCalledWith(1);
    });

    it('Given timeframes exist, When I request timeframes, Then I receive the timeframe list', async () => {
      const timeframes = [{ id: 1, name: 'H1', minutes: 60, mqlConstant: 'PERIOD_H1' }];
      mockGetTimeframes.mockResolvedValue(timeframes);

      const result = await controller.getTimeframes();

      expect(result).toEqual(timeframes);
    });
  });

  describe('Strategy CRUD', () => {
    it('Given strategies exist, When I list strategies, Then I receive all strategies', async () => {
      const strategies: Strategy[] = [{
        id: 1, name: 'Test', symbolId: 1, timeframeId: 5,
        config: { indicators: [], entryRules: [], riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 } },
        createdAt: new Date(),
      }];
      mockList.mockResolvedValue(strategies);

      const result = await controller.list();

      expect(result).toEqual(strategies);
    });

    it('Given a strategy exists, When I request it by id, Then I receive that strategy', async () => {
      const strategy: Strategy = {
        id: 1, name: 'Test', symbolId: 1, timeframeId: 5,
        config: { indicators: [], entryRules: [], riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 } },
        createdAt: new Date(),
      };
      mockGetById.mockResolvedValue(strategy);

      const result = await controller.getById(1);

      expect(result).toEqual(strategy);
      expect(mockGetById).toHaveBeenCalledWith(1);
    });

    it('Given valid strategy data, When I create a strategy, Then it is persisted and returned', async () => {
      const dto: CreateStrategyDto = {
        name: 'New Strategy',
        symbolId: 1,
        timeframeId: 5,
        indicators: [{ type: IndicatorType.SMA, params: { period: 20 } }],
        entryRules: [{ indicator: IndicatorType.SMA, condition: 'cross_above', value: 0 }],
        riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 },
      };
      const created: Strategy = {
        id: 1,
        name: dto.name,
        symbolId: dto.symbolId,
        timeframeId: dto.timeframeId,
        config: {
          indicators: dto.indicators,
          entryRules: dto.entryRules,
          riskSettings: dto.riskSettings,
        },
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(mockCreate).toHaveBeenCalledWith(dto);
    });
  });

  describe('Strategy Generation', () => {
    it('Given generation parameters, When I request strategy generation, Then strategies are created and saved', async () => {
      const dto: GenerateStrategiesDto = {
        symbolId: 1,
        timeframeId: 5,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        count: 2,
        riskSettings: { lotSize: 0.1, stopLossPips: 50, takeProfitPips: 100, maxDrawdownPercent: 20 },
      };
      const generated: GeneratedStrategy[] = [
        {
          name: 'Strategy 1 - SMA',
          indicators: [{ type: IndicatorType.SMA, params: { period: 20 } }],
          entryRules: [{ indicator: IndicatorType.SMA, condition: 'cross_above', value: 0 }],
          exitRules: [{ type: 'stop_loss', value: 50 }],
          riskSettings: dto.riskSettings,
        },
      ];
      mockGenerateStrategies.mockReturnValue(generated);
      mockCreate.mockResolvedValue({ id: 1, ...generated[0]!, createdAt: new Date() });

      const result = await controller.generateStrategies(dto);

      expect(mockGenerateStrategies).toHaveBeenCalledWith(2, dto.riskSettings);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('Backtesting', () => {
    it('Given a strategy and date range, When I run a backtest, Then I receive backtest metrics', async () => {
      const dto: BacktestRequestDto = {
        strategyId: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        initialBalance: 10000,
      };
      const metrics = {
        backtestId: 1,
        totalTrades: 10,
        winningTrades: 6,
        losingTrades: 4,
        totalProfit: 500,
        profitFactor: 1.5,
        maxDrawdown: 5.2,
        winRate: 0.6,
        finalBalance: 10500,
        trades: [],
      };
      mockRunBacktest.mockResolvedValue(metrics);

      const result = await controller.backtest(dto);

      expect(result).toEqual(metrics);
      expect(mockRunBacktest).toHaveBeenCalledWith(dto);
    });

    it('Given a strategy with backtests, When I request its backtest history, Then I receive all results', async () => {
      const backtests = [{ id: 1, strategyId: 1, totalProfit: 500 }];
      mockGetBacktests.mockResolvedValue(backtests);

      const result = await controller.getBacktests(1);

      expect(result).toEqual(backtests);
      expect(mockGetBacktests).toHaveBeenCalledWith(1);
    });
  });

  describe('Export', () => {
    it('Given a strategy, When I export as MQ4, Then I receive MQ4 source code', async () => {
      const dto: ExportStrategyDto = { strategyId: 1, format: 'mq4' };
      const exported = { code: '// MQ4 code', filename: 'test.mq4' };
      mockExportStrategy.mockResolvedValue(exported);

      const result = await controller.export(dto);

      expect(result).toEqual(exported);
      expect(mockExportStrategy).toHaveBeenCalledWith(1, 'mq4');
    });

    it('Given a strategy, When I export as MQ5, Then I receive MQ5 source code', async () => {
      const dto: ExportStrategyDto = { strategyId: 1, format: 'mq5' };
      const exported = { code: '// MQ5 code', filename: 'test.mq5' };
      mockExportStrategy.mockResolvedValue(exported);

      const result = await controller.export(dto);

      expect(result).toEqual(exported);
      expect(mockExportStrategy).toHaveBeenCalledWith(1, 'mq5');
    });
  });
});
