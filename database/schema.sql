-- Create database
CREATE DATABASE mint_price_api;

-- Use the database
\c mint_price_api;

-- Create transactions table for raw data (mint_id 改为 varchar)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    mint_id VARCHAR(70) NOT NULL,
    timestamp BIGINT NOT NULL,
    mint_size_epoch NUMERIC(30, 8) NOT NULL,
    mint_fee NUMERIC(30, 8) NOT NULL,
    price NUMERIC(30, 8) NOT NULL,
    current_era INTEGER,
    current_epoch INTEGER,
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mint_id, timestamp)
);

-- Create OHLC data table (mint_id 改为 varchar)
CREATE TABLE ohlc_data (
    id SERIAL PRIMARY KEY,
    mint_id VARCHAR(70) NOT NULL,
    period VARCHAR(10) NOT NULL, -- '5m', '15m', '30m', '1h', '4h', '1d'
    timestamp BIGINT NOT NULL, -- Start timestamp of the period
    open_price NUMERIC(30, 8) NOT NULL,
    high_price NUMERIC(30, 8) NOT NULL,
    low_price NUMERIC(30, 8) NOT NULL,
    close_price NUMERIC(30, 8) NOT NULL,
    volume NUMERIC(30, 8) NOT NULL,
    trade_count INTEGER DEFAULT 0,
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mint_id, period, timestamp)
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_mint_id ON transactions(mint_id);
CREATE INDEX idx_transactions_mint_timestamp ON transactions(mint_id, timestamp);
CREATE INDEX idx_ohlc_mint_id ON ohlc_data(mint_id);
CREATE INDEX idx_ohlc_mint_period_timestamp ON ohlc_data(mint_id, period, timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_ohlc_updated_at BEFORE UPDATE ON ohlc_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 同时修正 schema.sql 文件