import { describe, it, expect } from 'vitest';
import { StrategyGeneratorService } from './strategy-generator.service';
import { IndicatorType } from './dto/strategy-config.dto';
import type { RiskSettingsDto } from './dto/strategy-config.dto';

describe('StrategyGeneratorService', () => {
  const service = new StrategyGeneratorService();
  const riskSettings: RiskSettingsDto = {
    lotSize: 0.1,
    stopLossPips: 50,
    takeProfitPips: 100,
    maxDrawdownPercent: 20,
  };

  describe('generateStrategies', () => {
    it('should generate the requested number of strategies', () => {
      const result = service.generateStrategies(5, riskSettings);
      expect(result).toHaveLength(5);
    });

    it('should generate zero strategies when count is 0', () => {
      const result = service.generateStrategies(0, riskSettings);
      expect(result).toHaveLength(0);
    });

    it('should generate strategies with valid indicator types', () => {
      const result = service.generateStrategies(20, riskSettings);
      const validTypes = Object.values(IndicatorType);
      for (const strategy of result) {
        for (const indicator of strategy.indicators) {
          expect(validTypes).toContain(indicator.type);
        }
      }
    });

    it('should pass through risk settings to every strategy', () => {
      const result = service.generateStrategies(3, riskSettings);
      for (const strategy of result) {
        expect(strategy.riskSettings).toEqual(riskSettings);
      }
    });

    it('should generate unique names for each strategy', () => {
      const result = service.generateStrategies(10, riskSettings);
      const names = result.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('should generate at least one entry rule per strategy', () => {
      const result = service.generateStrategies(10, riskSettings);
      for (const strategy of result) {
        expect(strategy.entryRules.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should include stop_loss and take_profit exit rules', () => {
      const result = service.generateStrategies(5, riskSettings);
      for (const strategy of result) {
        const exitTypes = strategy.exitRules.map((r) => r.type);
        expect(exitTypes).toContain('stop_loss');
        expect(exitTypes).toContain('take_profit');
      }
    });

    it('should use the provided stop loss and take profit values in exit rules', () => {
      const result = service.generateStrategies(5, riskSettings);
      for (const strategy of result) {
        const sl = strategy.exitRules.find((r) => r.type === 'stop_loss');
        const tp = strategy.exitRules.find((r) => r.type === 'take_profit');
        expect(sl?.value).toBe(riskSettings.stopLossPips);
        expect(tp?.value).toBe(riskSettings.takeProfitPips);
      }
    });

    it('should generate SMA strategies with two SMA indicators', () => {
      const result = service.generateStrategies(100, riskSettings);
      const smaStrategies = result.filter((s) =>
        s.indicators.some((i) => i.type === IndicatorType.SMA)
      );
      expect(smaStrategies.length).toBeGreaterThan(0);
      for (const s of smaStrategies) {
        if (s.indicators.every((i) => i.type === IndicatorType.SMA)) {
          expect(s.indicators).toHaveLength(2);
        }
      }
    });

    it('should generate RSI strategies with period 14', () => {
      const result = service.generateStrategies(100, riskSettings);
      const rsiStrategies = result.filter((s) =>
        s.indicators.some((i) => i.type === IndicatorType.RSI)
      );
      for (const s of rsiStrategies) {
        const rsiIndicator = s.indicators.find((i) => i.type === IndicatorType.RSI);
        expect(rsiIndicator?.params['period']).toBe(14);
      }
    });
  });
});
