import { Mint } from '../models/Mint';
import { Transaction } from '../models/Transaction';
import { OHLCData } from '../models/OHLCData';
import logger from '../config/logger';
import { OHLCRecord, TransactionRecord } from '../types';

export class OHLCService {
  private static readonly PERIODS = ['5m', '15m', '30m', '1h', '4h', '1d'] as const;
  
  private static readonly PERIOD_MINUTES: Record<string, number> = {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  };

  static async generateOHLCForMint(mintAddress: string, period?: string): Promise<string[]> {
    try {
      const mint = await Mint.findByAddress(mintAddress);
      if (!mint) {
        throw new Error(`Mint not found: ${mintAddress}`);
      }

      const periodsToProcess = period ? [period] : this.PERIODS;
      const updatedPeriods: string[] = [];

      for (const p of periodsToProcess) {
        try {
          const count = await this.generateOHLCForPeriod(mint.address, p);
          if (count > 0) {
            updatedPeriods.push(p);
            logger.info(`Generated ${count} OHLC records for mint ${mintAddress}, period ${p}`);
          }
        } catch (error) {
          logger.error(`Error generating OHLC for mint ${mintAddress}, period ${p}:`, error);
        }
      }

      return updatedPeriods;
    } catch (error) {
      logger.error(`Error in generateOHLCForMint for ${mintAddress}:`, error);
      throw error;
    }
  }

  static async generateOHLCForAllMints(): Promise<number> {
    try {
      const mints = await Mint.getAll();
      let totalUpdated = 0;

      for (const mint of mints) {
        try {
          for (const period of this.PERIODS) {
            const count = await this.generateOHLCForPeriod(mint.address, period);
            totalUpdated += count;
          }
        } catch (error) {
          logger.error(`Error generating OHLC for mint ${mint.address}:`, error);
        }
      }

      logger.info(`Generated ${totalUpdated} total OHLC records for all mints`);
      return totalUpdated;
    } catch (error) {
      logger.error('Error in generateOHLCForAllMints:', error);
      throw error;
    }
  }

  private static async generateOHLCForPeriod(mintId: string, period: string): Promise<number> {
    try {
      const periodMinutes = this.PERIOD_MINUTES[period];
      if (!periodMinutes) {
        throw new Error(`Invalid period: ${period}`);
      }

      // Get the latest OHLC timestamp for this mint and period
      const latestOHLC = await OHLCData.getLatestTimestamp(mintId, period as any);
      const startTime = latestOHLC ? latestOHLC + (periodMinutes * 60) : 0; // If startTime is 0, that means fetch from beginning.

      // Get transactions since the last OHLC timestamp
      const transactions = await Transaction.findByMintIdAndTimeRange(mintId, startTime);
      if (transactions.length === 0) {
        return 0;
      }

      // Group transactions by time periods
      const groupedTransactions = this.groupTransactionsByPeriod(transactions, periodMinutes);
      let insertedCount = 0;
      for (const [timestamp, periodTransactions] of groupedTransactions) {
        const ohlcData = this.calculateOHLC(periodTransactions);
        
        const ohlcRecord: Omit<OHLCRecord, 'id'> = {
          mint_id: mintId,
          period,
          timestamp: parseInt(timestamp),
          open_price: ohlcData.open,
          high_price: ohlcData.high,
          low_price: ohlcData.low,
          close_price: ohlcData.close,
          volume: ohlcData.volume,
          trade_count: periodTransactions.length,
          updated_at: new Date()
        };

        await OHLCData.upsert(ohlcRecord);
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      logger.error(`Error generating OHLC for period ${period}:`, error);
      throw error;
    }
  }

  private static groupTransactionsByPeriod(
    transactions: TransactionRecord[], 
    periodMinutes: number
  ): Map<string, TransactionRecord[]> {
    const grouped = new Map<string, TransactionRecord[]>();
    const periodSeconds = periodMinutes * 60;

    for (const transaction of transactions) {
      // Round down to the nearest period boundary
      const periodStart = Math.floor(transaction.timestamp / periodSeconds) * periodSeconds;
      const key = periodStart.toString();
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(transaction);
    }

    return grouped;
  }

  private static calculateOHLC(transactions: TransactionRecord[]): {
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  } {
    if (transactions.length === 0) {
      throw new Error('Cannot calculate OHLC for empty transaction list');
    }

    // Sort transactions by timestamp
    const sortedTransactions = transactions.sort((a, b) => a.timestamp - b.timestamp);
    
    const open = sortedTransactions[0].price.toString();
    const close = sortedTransactions[sortedTransactions.length - 1].price.toString();
    
    let high = sortedTransactions[0].price;
    let low = sortedTransactions[0].price;
    let volume = 0n;  // 使用 BigInt

    for (const transaction of sortedTransactions) {
      const price = transaction.price;
      const amount = BigInt(Math.floor(transaction.mint_size_epoch));
      
      high = Math.max(high, price);
      low = Math.min(low, price);
      volume += amount;
    }

    const actualVolume = volume / 1000000000n;

    return { 
      open, 
      high: high.toString(), 
      low: low.toString(), 
      close, 
      volume: actualVolume.toString() 
    };
  }

  // 添加这个方法来重建所有历史OHLC数据
  static async rebuildOHLCForMint(mintAddress: string, period?: string): Promise<string[]> {
    try {
      const mint = await Mint.findByAddress(mintAddress.trim());
      if (!mint) {
        throw new Error(`Mint not found: ${mintAddress}`);
      }

      const periodsToProcess = period ? [period] : this.PERIODS;
      const updatedPeriods: string[] = [];

      for (const p of periodsToProcess) {
        try {
          // 删除该mint和period的所有现有OHLC数据
          await OHLCData.deleteByMintAndPeriod(mint.address, p);
          
          // 重新生成所有历史数据
          const count = await this.generateOHLCForPeriodFromBeginning(mint.address, p);
          if (count > 0) {
            updatedPeriods.push(p);
            logger.info(`Rebuilt ${count} OHLC records for mint ${mintAddress}, period ${p}`);
          }
        } catch (error) {
          logger.error(`Error rebuilding OHLC for mint ${mintAddress}, period ${p}:`, error);
        }
      }

      return updatedPeriods;
    } catch (error) {
      logger.error(`Error in rebuildOHLCForMint for ${mintAddress}:`, error);
      throw error;
    }
  }

  // 从头开始生成OHLC数据的私有方法
  private static async generateOHLCForPeriodFromBeginning(mintId: string, period: string): Promise<number> {
    try {
      const periodMinutes = this.PERIOD_MINUTES[period];
      if (!periodMinutes) {
        throw new Error(`Invalid period: ${period}`);
      }

      const transactions = await Transaction.findByMintIdAndTimeRange(mintId, 0);
      if (transactions.length === 0) {
        return 0;
      }
      const groupedTransactions = this.groupTransactionsByPeriod(transactions, periodMinutes);
      
      let insertedCount = 0;
      for (const [timestamp, periodTransactions] of groupedTransactions) {
        const ohlcData = this.calculateOHLC(periodTransactions);
        
        const ohlcRecord: Omit<OHLCRecord, 'id'> = {
          mint_id: mintId,
          period,
          timestamp: parseInt(timestamp),
          open_price: ohlcData.open,
          high_price: ohlcData.high,
          low_price: ohlcData.low,
          close_price: ohlcData.close,
          volume: ohlcData.volume,
          trade_count: periodTransactions.length,
          updated_at: new Date()
        };

        await OHLCData.upsert(ohlcRecord);
        insertedCount++;
      }

      return insertedCount;
    } catch (error) {
      logger.error(`Error generating OHLC from beginning for period ${period}:`, error);
      throw error;
    }
  }

  // 重建所有mint的所有历史OHLC数据
  static async rebuildOHLCForAllMints(): Promise<number> {
    try {
      const mints = await Mint.getAll();
      let totalRebuilt = 0;

      for (const mint of mints) {
        try {
          for (const period of this.PERIODS) {
            const count = await this.generateOHLCForPeriodFromBeginning(mint.address, period);
            totalRebuilt += count;
          }
        } catch (error) {
          logger.error(`Error rebuilding OHLC for mint ${mint.address}:`, error);
        }
      }

      logger.info(`Rebuilt ${totalRebuilt} total OHLC records for all mints`);
      return totalRebuilt;
    } catch (error) {
      logger.error('Error in rebuildOHLCForAllMints:', error);
      throw error;
    }
  }
}