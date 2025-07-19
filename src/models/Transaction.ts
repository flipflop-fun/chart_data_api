import pool from '../config/database';
import { TransactionRecord } from '../types';

export class Transaction {
  static async create(
    mintId: string, // Changed to string type
    timestamp: number,
    mintSizeEpoch: number,
    mintFee: number,
    price: number,
    currentEra?: number,
    currentEpoch?: number
  ): Promise<TransactionRecord | undefined> {
    const query = `
      INSERT INTO transactions (mint_id, timestamp, mint_size_epoch, mint_fee, price, current_era, current_epoch)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (mint_id, timestamp) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [
      mintId, timestamp, mintSizeEpoch, mintFee, price, currentEra, currentEpoch
    ]);
    return result.rows[0];
  }

  static async getLatestTimestamp(mintId: string): Promise<number> { // Changed to string type
    const query = 'SELECT MAX(timestamp) as latest_timestamp FROM transactions WHERE mint_id = $1';
    const result = await pool.query(query, [mintId]);
    return result.rows[0]?.latest_timestamp || 0;
  }

  static async findByMintIdAndTimeRange(
    mintId: string, // Changed to string type
    startTime: number,
    endTime?: number
  ): Promise<TransactionRecord[]> {
    let query = `
      SELECT * FROM transactions 
      WHERE mint_id = $1 AND timestamp >= $2
    `;
    const params: any[] = [mintId, startTime];
    
    if (endTime !== undefined) {
      query += ` AND timestamp <= $3`;
      params.push(endTime);
    }
    
    query += ` ORDER BY timestamp ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByMintId(
    mintId: string, // Changed to string type
    options: { from?: number; to?: number; limit?: number } = {}
  ): Promise<TransactionRecord[]> {
    const { from, to, limit = 1000 } = options;
    let query = `
      SELECT * FROM transactions 
      WHERE mint_id = $1
    `;
    const params: any[] = [mintId];
    
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
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Keep original method for compatibility
  static async getByMintAndTimeRange(
    mintId: string, // Changed to string type
    startTime: number,
    endTime: number
  ): Promise<TransactionRecord[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE mint_id = $1 AND timestamp >= $2 AND timestamp <= $3
      ORDER BY timestamp ASC
    `;
    const result = await pool.query(query, [mintId, startTime, endTime]);
    return result.rows;
  }
}