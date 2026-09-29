import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';

export interface PriceBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Market {
  id: number;
  name: string;
  description: string;
}

export interface Symbol {
  id: number;
  marketId: number;
  symbol: string;
  name: string;
}

export interface Timeframe {
  id: number;
  name: string;
  minutes: number;
  mqlConstant: string;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(private readonly db: DatabaseService) {}

  async getMarkets(): Promise<Market[]> {
    const { rows } = await this.db.pool.query<Market>(
      'SELECT id, name, description FROM markets ORDER BY name'
    );
    return rows;
  }

  async getSymbols(marketId?: number): Promise<Symbol[]> {
    const query = marketId
      ? 'SELECT id, market_id as "marketId", symbol, name FROM symbols WHERE market_id = $1 ORDER BY symbol'
      : 'SELECT id, market_id as "marketId", symbol, name FROM symbols ORDER BY symbol';
    const params = marketId ? [marketId] : [];
    const { rows } = await this.db.pool.query<Symbol>(query, params);
    return rows;
  }

  async getTimeframes(): Promise<Timeframe[]> {
    const { rows } = await this.db.pool.query<Timeframe>(
      'SELECT id, name, minutes, mql_constant as "mqlConstant" FROM timeframes ORDER BY minutes'
    );
    return rows;
  }

  async getHistoricalData(
    symbolId: number,
    timeframeId: number,
    startDate: string,
    endDate: string
  ): Promise<PriceBar[]> {
    const { rows: cached } = await this.db.pool.query<PriceBar>(
      `SELECT timestamp, open, high, low, close, volume 
       FROM price_data 
       WHERE symbol_id = $1 AND timeframe_id = $2 
         AND timestamp >= $3 AND timestamp <= $4 
       ORDER BY timestamp`,
      [symbolId, timeframeId, startDate, endDate]
    );

    if (cached.length > 0) {
      this.logger.log(`Returning ${cached.length} cached bars`);
      return cached;
    }

    const bars = this.generateSyntheticData(startDate, endDate, timeframeId);
    
    for (const bar of bars) {
      await this.db.pool.query(
        `INSERT INTO price_data (symbol_id, timeframe_id, timestamp, open, high, low, close, volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (symbol_id, timeframe_id, timestamp) DO NOTHING`,
        [symbolId, timeframeId, bar.timestamp, bar.open, bar.high, bar.low, bar.close, bar.volume]
      );
    }

    return bars;
  }

  private generateSyntheticData(startDate: string, endDate: string, timeframeId: number): PriceBar[] {
    const bars: PriceBar[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let minutesPerBar = 60;
    if (timeframeId === 1) minutesPerBar = 1;
    else if (timeframeId === 2) minutesPerBar = 5;
    else if (timeframeId === 3) minutesPerBar = 15;
    else if (timeframeId === 4) minutesPerBar = 30;
    else if (timeframeId === 6) minutesPerBar = 240;
    else if (timeframeId === 7) minutesPerBar = 1440;

    let currentPrice = 1.1000;
    let current = new Date(start);

    while (current <= end) {
      const change = (Math.random() - 0.5) * 0.002;
      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 0.001;
      const low = Math.min(open, close) - Math.random() * 0.001;
      
      bars.push({
        timestamp: new Date(current),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1000) + 100
      });

      currentPrice = close;
      current = new Date(current.getTime() + minutesPerBar * 60 * 1000);
    }

    return bars;
  }
}
