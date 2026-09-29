import { Injectable, Logger } from '@nestjs/common';
import { IndicatorType, OrderType, type RiskSettingsDto } from './dto/strategy-config.dto';

export interface GeneratedStrategy {
  name: string;
  indicators: Array<{ type: IndicatorType; params: Record<string, number> }>;
  entryRules: Array<{ indicator: IndicatorType; condition: string; value: number }>;
  exitRules: Array<{ type: string; value: number }>;
  riskSettings: RiskSettingsDto;
}

@Injectable()
export class StrategyGeneratorService {
  private readonly logger = new Logger(StrategyGeneratorService.name);

  generateStrategies(count: number, riskSettings: RiskSettingsDto): GeneratedStrategy[] {
    const strategies: GeneratedStrategy[] = [];

    for (let i = 0; i < count; i++) {
      strategies.push(this.generateRandomStrategy(i + 1, riskSettings));
    }

    return strategies;
  }

  private generateRandomStrategy(index: number, riskSettings: RiskSettingsDto): GeneratedStrategy {
    const indicatorTypes = [IndicatorType.SMA, IndicatorType.EMA, IndicatorType.RSI, IndicatorType.MACD];
    const selectedIndicator = indicatorTypes[Math.floor(Math.random() * indicatorTypes.length)];

    let indicators: Array<{ type: IndicatorType; params: Record<string, number> }> = [];
    let entryRules: Array<{ indicator: IndicatorType; condition: string; value: number }> = [];

    switch (selectedIndicator) {
      case IndicatorType.SMA:
        indicators = [
          { type: IndicatorType.SMA, params: { period: 20 + Math.floor(Math.random() * 30) } },
          { type: IndicatorType.SMA, params: { period: 50 + Math.floor(Math.random() * 50) } }
        ];
        entryRules = [
          { indicator: IndicatorType.SMA, condition: 'cross_above', value: 0 }
        ];
        break;

      case IndicatorType.EMA:
        indicators = [
          { type: IndicatorType.EMA, params: { period: 12 + Math.floor(Math.random() * 20) } }
        ];
        entryRules = [
          { indicator: IndicatorType.EMA, condition: 'price_above', value: 0 }
        ];
        break;

      case IndicatorType.RSI:
        indicators = [
          { type: IndicatorType.RSI, params: { period: 14 } }
        ];
        entryRules = [
          { indicator: IndicatorType.RSI, condition: 'below', value: 30 + Math.floor(Math.random() * 10) }
        ];
        break;

      case IndicatorType.MACD:
        indicators = [
          { type: IndicatorType.MACD, params: { fast: 12, slow: 26, signal: 9 } }
        ];
        entryRules = [
          { indicator: IndicatorType.MACD, condition: 'cross_above_signal', value: 0 }
        ];
        break;
    }

    return {
      name: `Strategy ${index} - ${selectedIndicator}`,
      indicators,
      entryRules,
      exitRules: [
        { type: 'stop_loss', value: riskSettings.stopLossPips },
        { type: 'take_profit', value: riskSettings.takeProfitPips }
      ],
      riskSettings
    };
  }
}
