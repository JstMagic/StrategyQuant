import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import type { CreateStrategyDto, StrategyConfig, BacktestMetrics } from './dto/strategy-config.dto';

export interface Strategy {
  id: number;
  name: string;
  symbolId: number;
  timeframeId: number;
  config: StrategyConfig;
  createdAt: Date;
}

export interface BacktestResult {
  id: number;
  strategyId: number;
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
  metrics: BacktestMetrics;
  createdAt: Date;
}

@Injectable()
export class StrategiesService {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<Strategy[]> {
    const { rows } = await this.db.pool.query<Strategy>(
      `SELECT id, name, symbol_id as "symbolId", timeframe_id as "timeframeId", 
              config, created_at as "createdAt"
       FROM strategies 
       ORDER BY created_at DESC 
       LIMIT 100`
    );
    return rows;
  }

  async getById(id: number): Promise<Strategy> {
    const { rows } = await this.db.pool.query<Strategy>(
      `SELECT id, name, symbol_id as "symbolId", timeframe_id as "timeframeId", 
              config, created_at as "createdAt"
       FROM strategies 
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    return rows[0]!;
  }

  async create(dto: CreateStrategyDto): Promise<Strategy> {
    const config = {
      indicators: dto.indicators,
      entryRules: dto.entryRules,
      riskSettings: dto.riskSettings,
    };

    const { rows } = await this.db.pool.query<Strategy>(
      `INSERT INTO strategies (name, symbol_id, timeframe_id, config)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, symbol_id as "symbolId", timeframe_id as "timeframeId", 
                 config, created_at as "createdAt"`,
      [dto.name, dto.symbolId, dto.timeframeId, JSON.stringify(config)]
    );

    return rows[0]!;
  }

  async getBacktests(strategyId: number): Promise<BacktestResult[]> {
    const { rows } = await this.db.pool.query<BacktestResult>(
      `SELECT id, strategy_id as "strategyId", start_date as "startDate", 
              end_date as "endDate", initial_balance as "initialBalance",
              final_balance as "finalBalance", total_profit as "totalProfit",
              profit_factor as "profitFactor", max_drawdown as "maxDrawdown",
              win_rate as "winRate", total_trades as "totalTrades",
              winning_trades as "winningTrades", losing_trades as "losingTrades",
              metrics, created_at as "createdAt"
       FROM backtest_results
       WHERE strategy_id = $1
       ORDER BY created_at DESC`,
      [strategyId]
    );

    return rows;
  }
}
