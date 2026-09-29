import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { MarketDataService, type PriceBar } from './market-data.service';
import { StrategiesService } from './strategies.service';
import type { BacktestRequestDto, StrategyConfig, BacktestMetrics } from './dto/strategy-config.dto';

interface Trade {
  entryTime: Date;
  entryPrice: number;
  exitTime?: Date;
  exitPrice?: number;
  type: 'BUY' | 'SELL';
  lotSize: number;
  profit?: number;
  stopLoss: number;
  takeProfit: number;
}

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly marketData: MarketDataService,
    private readonly strategies: StrategiesService,
  ) {}

  async runBacktest(dto: BacktestRequestDto): Promise<BacktestMetrics & { backtestId: number }> {
    this.logger.log(`Running backtest for strategy ${dto.strategyId}`);

    const strategy = await this.strategies.getById(dto.strategyId);
    const bars = await this.marketData.getHistoricalData(
      strategy.symbolId,
      strategy.timeframeId,
      dto.startDate,
      dto.endDate
    );

    const metrics = this.simulateStrategy(bars, strategy.config, dto.initialBalance);

    const { rows } = await this.db.pool.query(
      `INSERT INTO backtest_results 
       (strategy_id, start_date, end_date, initial_balance, final_balance, 
        total_profit, profit_factor, max_drawdown, win_rate, total_trades, 
        winning_trades, losing_trades, metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        dto.strategyId,
        dto.startDate,
        dto.endDate,
        dto.initialBalance,
        metrics.finalBalance,
        metrics.totalProfit,
        metrics.profitFactor,
        metrics.maxDrawdown,
        metrics.winRate,
        metrics.totalTrades,
        metrics.winningTrades,
        metrics.losingTrades,
        JSON.stringify(metrics),
      ]
    );

    return {
      backtestId: rows[0]!.id,
      ...metrics,
    };
  }

  private simulateStrategy(bars: PriceBar[], config: StrategyConfig, initialBalance: number): BacktestMetrics {
    const trades: Trade[] = [];
    let balance = initialBalance;
    let openTrade: Trade | null = null;
    let maxBalance = initialBalance;
    let maxDrawdown = 0;

    const riskSettings = config.riskSettings;
    const pipValue = 0.0001; // For forex pairs

    for (let i = 50; i < bars.length; i++) {
      const currentBar = bars[i]!;

      // Close existing trade if stop loss or take profit hit
      if (openTrade && !openTrade.exitTime) {
        const currentPrice = currentBar.close;
        
        if (openTrade.type === 'BUY') {
          if (currentPrice <= openTrade.stopLoss || currentPrice >= openTrade.takeProfit) {
            openTrade.exitTime = currentBar.timestamp;
            openTrade.exitPrice = currentPrice <= openTrade.stopLoss ? openTrade.stopLoss : openTrade.takeProfit;
            openTrade.profit = (openTrade.exitPrice - openTrade.entryPrice) * openTrade.lotSize * 100000;
            balance += openTrade.profit;
            openTrade = null;
          }
        } else {
          if (currentPrice >= openTrade.stopLoss || currentPrice <= openTrade.takeProfit) {
            openTrade.exitTime = currentBar.timestamp;
            openTrade.exitPrice = currentPrice >= openTrade.stopLoss ? openTrade.stopLoss : openTrade.takeProfit;
            openTrade.profit = (openTrade.entryPrice - openTrade.exitPrice) * openTrade.lotSize * 100000;
            balance += openTrade.profit;
            openTrade = null;
          }
        }
      }

      // Check for new entry signal
      if (!openTrade && this.checkEntrySignal(bars, i, config)) {
        const entryPrice = currentBar.close;
        const type: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
        
        const stopLoss = type === 'BUY' 
          ? entryPrice - (riskSettings.stopLossPips * pipValue)
          : entryPrice + (riskSettings.stopLossPips * pipValue);
        
        const takeProfit = type === 'BUY'
          ? entryPrice + (riskSettings.takeProfitPips * pipValue)
          : entryPrice - (riskSettings.takeProfitPips * pipValue);

        openTrade = {
          entryTime: currentBar.timestamp,
          entryPrice,
          type,
          lotSize: riskSettings.lotSize,
          stopLoss,
          takeProfit,
        };

        trades.push(openTrade);
      }

      // Track drawdown
      if (balance > maxBalance) {
        maxBalance = balance;
      }
      const drawdown = ((maxBalance - balance) / maxBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate metrics
    const winningTrades = trades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit && t.profit < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const grossProfit = trades.filter(t => t.profit && t.profit > 0).reduce((sum, t) => sum + t.profit!, 0);
    const grossLoss = Math.abs(trades.filter(t => t.profit && t.profit < 0).reduce((sum, t) => sum + t.profit!, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    const winRate = trades.length > 0 ? winningTrades / trades.length : 0;

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      totalProfit,
      profitFactor,
      maxDrawdown,
      winRate,
      finalBalance: balance,
      trades,
    };
  }

  private checkEntrySignal(bars: PriceBar[], index: number, config: StrategyConfig): boolean {
    // Simple moving average crossover example
    if (config.indicators.some((ind) => ind.type === 'SMA')) {
      const sma20 = this.calculateSMA(bars, index, 20);
      const sma50 = this.calculateSMA(bars, index, 50);
      const prevSma20 = this.calculateSMA(bars, index - 1, 20);
      const prevSma50 = this.calculateSMA(bars, index - 1, 50);

      // Bullish crossover
      if (prevSma20 <= prevSma50 && sma20 > sma50) {
        return true;
      }
    }

    // RSI oversold example
    if (config.indicators.some((ind) => ind.type === 'RSI')) {
      const rsi = this.calculateRSI(bars, index, 14);
      if (rsi < 30) {
        return true;
      }
    }

    return Math.random() < 0.05; // 5% random entry for demo
  }

  private calculateSMA(bars: PriceBar[], index: number, period: number): number {
    if (index < period - 1) return bars[index]!.close;
    
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += bars[index - i]!.close;
    }
    return sum / period;
  }

  private calculateRSI(bars: PriceBar[], index: number, period: number): number {
    if (index < period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = bars[index - i + 1]!.close - bars[index - i]!.close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}
