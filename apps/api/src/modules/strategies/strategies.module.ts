import { Module } from '@nestjs/common';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { MarketDataService } from './market-data.service';
import { StrategyGeneratorService } from './strategy-generator.service';
import { BacktestService } from './backtest.service';
import { ExportService } from './export.service';
import { DatabaseService } from '../../common/database.service';

@Module({
  controllers: [StrategiesController],
  providers: [
    StrategiesService,
    MarketDataService,
    StrategyGeneratorService,
    BacktestService,
    ExportService,
    DatabaseService,
  ],
})
export class StrategiesModule {}
