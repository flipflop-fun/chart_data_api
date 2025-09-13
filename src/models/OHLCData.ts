import pgPool from '../config/database';
import { OHLCRecord, Period } from '../types';

export class OHLCData {
  static async upsert(record: Omit<OHLCRecord, 'id'>): Promise<OHLCRecord> {
    const query = `
      INSERT INTO ohlc_data (mint_id, period, timestamp, open_price, high_price, low_price, close_price, volume, trade_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (mint_id, period, timestamp) DO UPDATE SET
        high_price = GREATEST(ohlc_data.high_price, EXCLUDED.high_price),
        low_price = LEAST(ohlc_data.low_price, EXCLUDED.low_price),
        close_price = EXCLUDED.close_price,
        volume = ohlc_data.volume + EXCLUDED.volume,
        trade_count = ohlc_data.trade_count + EXCLUDED.trade_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pgPool.query(query, [
      record.mint_id, 
      record.period, 
      record.timestamp, 
      record.open_price, 
      record.high_price, 
      record.low_price, 
      record.close_price, 
      record.volume, 
      record.trade_count
    ]);
    return result.rows[0];
  }

  static async getLatestTimestamp(mintId: string, period: Period): Promise<number | null> { // Changed to string type
    const query = `
      SELECT MAX(timestamp) as latest_timestamp 
      FROM ohlc_data 
      WHERE mint_id = $1 AND period = $2
    `;
    const result = await pgPool.query(query, [mintId, period]);
    return result.rows[0]?.latest_timestamp || null;
  }

  static async findByMintAndPeriod(
    mintAddress: string,
    period: Period,
    options: { from?: number; to?: number; limit?: number } = {}
  ): Promise<OHLCRecord[]> {
    const { from, to, limit = 1000 } = options;
    let query = `
      SELECT * FROM ohlc_data 
      WHERE mint_id = $1 AND period = $2
    `;
    const params: any[] = [mintAddress, period];
    
    if (from !== undefined) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(from);
    }
    
    if (to !== undefined) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(to);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pgPool.query(query, params);
    return result.rows;
  }

  // Keep original method for compatibility
  static async getByMintAndPeriod(
    mintId: string, // Changed to string type
    period: Period,
    startTime: number,
    endTime: number,
    limit: number = 1000
  ): Promise<OHLCRecord[]> {
    const query = `
      SELECT * FROM ohlc_data 
      WHERE mint_id = $1 AND period = $2 AND timestamp >= $3 AND timestamp <= $4
      ORDER BY timestamp DESC
      LIMIT $5
    `;
    const result = await pgPool.query(query, [mintId, period, startTime, endTime, limit]);
    return result.rows;
  }

  static async getLatestByMintAndPeriod(
    mintId: string, // Changed to string type
    period: Period
  ): Promise<OHLCRecord | undefined> {
    const query = `
      SELECT * FROM ohlc_data 
      WHERE mint_id = $1 AND period = $2
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const result = await pgPool.query(query, [mintId, period]);
    return result.rows[0];
  }

  // Method to delete all OHLC data for a specific mint and period
  static async deleteByMintAndPeriod(mintId: string, period: string): Promise<void> {
    const query = `
      DELETE FROM ohlc_data 
      WHERE mint_id = $1 AND period = $2
    `;
    await pgPool.query(query, [mintId, period]);
  }
}