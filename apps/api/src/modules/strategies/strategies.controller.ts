import { Body, Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { MarketDataService } from './market-data.service';
import { StrategyGeneratorService } from './strategy-generator.service';
import { BacktestService } from './backtest.service';
import { ExportService } from './export.service';
import {
  CreateStrategyDto,
  GenerateStrategiesDto,
  BacktestRequestDto,
  ExportStrategyDto,
} from './dto/strategy-config.dto';

@Controller('strategies')
export class StrategiesController {
  constructor(
    private readonly strategiesService: StrategiesService,
    private readonly marketDataService: MarketDataService,
    private readonly generatorService: StrategyGeneratorService,
    private readonly backtestService: BacktestService,
    private readonly exportService: ExportService,
  ) {}

  @Get('markets')
  getMarkets() {
    return this.marketDataService.getMarkets();
  }

  @Get('symbols')
  getSymbols(@Query('marketId', ParseIntPipe) marketId?: number) {
    return this.marketDataService.getSymbols(marketId);
  }

  @Get('timeframes')
  getTimeframes() {
    return this.marketDataService.getTimeframes();
  }

  @Post('generate')
  async generateStrategies(@Body() dto: GenerateStrategiesDto) {
    const generated = this.generatorService.generateStrategies(dto.count, dto.riskSettings);
    
    const saved = [];
    for (const strategy of generated) {
      const created = await this.strategiesService.create({
        name: strategy.name,
        symbolId: dto.symbolId,
        timeframeId: dto.timeframeId,
        indicators: strategy.indicators,
        entryRules: strategy.entryRules,
        riskSettings: strategy.riskSettings,
      });
      saved.push(created);
    }

    return saved;
  }

  @Get()
  list() {
    return this.strategiesService.list();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.strategiesService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateStrategyDto) {
    return this.strategiesService.create(dto);
  }

  @Post('backtest')
  async backtest(@Body() dto: BacktestRequestDto) {
    return this.backtestService.runBacktest(dto);
  }

  @Get(':id/backtests')
  getBacktests(@Param('id', ParseIntPipe) strategyId: number) {
    return this.strategiesService.getBacktests(strategyId);
  }

  @Post('export')
  async export(@Body() dto: ExportStrategyDto) {
    return this.exportService.exportStrategy(dto.strategyId, dto.format);
  }
}
