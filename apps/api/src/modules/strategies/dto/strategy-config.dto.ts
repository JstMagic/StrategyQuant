import { IsString, IsInt, IsNumber, IsDateString, IsObject, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum IndicatorType {
  SMA = 'SMA',
  EMA = 'EMA',
  RSI = 'RSI',
  MACD = 'MACD',
  BOLLINGER = 'BOLLINGER'
}

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface StrategyConfig {
  indicators: IndicatorConfigDto[];
  entryRules: EntryRuleDto[];
  riskSettings: RiskSettingsDto;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  winRate: number;
  finalBalance: number;
  trades: unknown[];
}

export class IndicatorConfigDto {
  @IsEnum(IndicatorType)
  type!: IndicatorType;

  @IsObject()
  params!: Record<string, number>;
}

export class EntryRuleDto {
  @IsEnum(IndicatorType)
  indicator!: IndicatorType;

  @IsString()
  condition!: string;

  @IsNumber()
  value!: number;
}

export class RiskSettingsDto {
  @IsNumber()
  @Min(0.01)
  @Max(100)
  lotSize!: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  stopLossPips!: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  takeProfitPips!: number;

  @IsNumber()
  @Min(100)
  maxDrawdownPercent!: number;
}

export class GenerateStrategiesDto {
  @IsInt()
  symbolId!: number;

  @IsInt()
  timeframeId!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  count!: number;

  @ValidateNested()
  @Type(() => RiskSettingsDto)
  riskSettings!: RiskSettingsDto;
}

export class CreateStrategyDto {
  @IsString()
  name!: string;

  @IsInt()
  symbolId!: number;

  @IsInt()
  timeframeId!: number;

  @ValidateNested({ each: true })
  @Type(() => IndicatorConfigDto)
  indicators!: IndicatorConfigDto[];

  @ValidateNested({ each: true })
  @Type(() => EntryRuleDto)
  entryRules!: EntryRuleDto[];

  @ValidateNested()
  @Type(() => RiskSettingsDto)
  riskSettings!: RiskSettingsDto;
}

export class BacktestRequestDto {
  @IsInt()
  strategyId!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(100)
  initialBalance!: number;
}

export class ExportStrategyDto {
  @IsInt()
  strategyId!: number;

  @IsEnum(['mq4', 'mq5'])
  format!: 'mq4' | 'mq5';
}
