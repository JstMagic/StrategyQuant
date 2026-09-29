-- Markets and symbols
CREATE TABLE markets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE symbols (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(market_id, symbol)
);

-- Timeframes
CREATE TABLE timeframes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  minutes INTEGER NOT NULL,
  mql_constant VARCHAR(20) NOT NULL
);

-- User strategies
CREATE TABLE strategies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  symbol_id INTEGER REFERENCES symbols(id) ON DELETE CASCADE,
  timeframe_id INTEGER REFERENCES timeframes(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backtest results
CREATE TABLE backtest_results (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER REFERENCES strategies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL,
  final_balance DECIMAL(15,2) NOT NULL,
  total_profit DECIMAL(15,2) NOT NULL,
  profit_factor DECIMAL(10,4),
  max_drawdown DECIMAL(10,4),
  win_rate DECIMAL(5,4),
  total_trades INTEGER NOT NULL,
  winning_trades INTEGER NOT NULL,
  losing_trades INTEGER NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical price data cache
CREATE TABLE price_data (
  id SERIAL PRIMARY KEY,
  symbol_id INTEGER REFERENCES symbols(id) ON DELETE CASCADE,
  timeframe_id INTEGER REFERENCES timeframes(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(15,5) NOT NULL,
  high DECIMAL(15,5) NOT NULL,
  low DECIMAL(15,5) NOT NULL,
  close DECIMAL(15,5) NOT NULL,
  volume BIGINT,
  UNIQUE(symbol_id, timeframe_id, timestamp)
);

CREATE INDEX idx_price_data_lookup ON price_data(symbol_id, timeframe_id, timestamp);
CREATE INDEX idx_strategies_symbol ON strategies(symbol_id);
CREATE INDEX idx_backtest_strategy ON backtest_results(strategy_id);

-- Seed initial data
INSERT INTO markets (name, description) VALUES
  ('Forex', 'Foreign Exchange Market'),
  ('Crypto', 'Cryptocurrency Market');

INSERT INTO symbols (market_id, symbol, name) VALUES
  (1, 'EURUSD', 'Euro vs US Dollar'),
  (1, 'GBPUSD', 'British Pound vs US Dollar'),
  (1, 'USDJPY', 'US Dollar vs Japanese Yen'),
  (2, 'BTCUSD', 'Bitcoin vs US Dollar'),
  (2, 'ETHUSD', 'Ethereum vs US Dollar');

INSERT INTO timeframes (name, minutes, mql_constant) VALUES
  ('M1', 1, 'PERIOD_M1'),
  ('M5', 5, 'PERIOD_M5'),
  ('M15', 15, 'PERIOD_M15'),
  ('M30', 30, 'PERIOD_M30'),
  ('H1', 60, 'PERIOD_H1'),
  ('H4', 240, 'PERIOD_H4'),
  ('D1', 1440, 'PERIOD_D1');
