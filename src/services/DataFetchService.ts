import graphqlClient from '../graphql/client';
import { queryAllTokenMintForChart } from '../graphql/queries';
import { Mint } from '../models/Mint';
import { Transaction } from '../models/Transaction';
import logger from '../config/logger';
import { PGMintTokenResponse } from '../types';

export class DataFetchService {
  static async fetchDataForMint(mintAddress: string, batchSize: number = 1000): Promise<number> {
    try {
      // Get or create mint record
      let mint = await Mint.findByAddress(mintAddress);
      if (!mint) {
        return 0;
      }

      // Get latest timestamp to avoid duplicate data
      const latestTimestamp = await Transaction.getLatestTimestamp(mint.address);
      
      let skip = 0;
      let hasMore = true;
      let newTransactionsCount = 0;

      while (hasMore) {
        const data = await graphqlClient.request<PGMintTokenResponse>(
          queryAllTokenMintForChart,
          {
            mint: mintAddress,
            offset: skip,
            first: batchSize
          }
        );

        const transactions = data.allMintTokenEntities?.nodes || [];
        
        if (transactions.length === 0) {
          hasMore = false;
          break;
        }

        // Process transactions
        for (const tx of transactions) {
          const timestamp = parseInt(tx.timestamp);
          
          // Skip if we already have this transaction
          if (timestamp <= latestTimestamp) {
            hasMore = false;
            break;
          }

          const mintSizeEpoch = parseFloat(tx.mintSizeEpoch);
          // const mintFee = parseFloat(tx.mintFee);
          const feeRate = mint.feeRate; // Use feeRate from mint instead of actural mint fee
          const price = mintSizeEpoch > 0 ? feeRate / mintSizeEpoch : 0;

          await Transaction.create(
            mint.address,
            timestamp,
            mintSizeEpoch,
            feeRate,
            price,
            tx.currentEra,
            tx.currentEpoch
          );

          newTransactionsCount++;
        }

        skip += batchSize;
        
        // If we got less than batchSize, we've reached the end
        if (transactions.length < batchSize) {
          hasMore = false;
        }
      }

      logger.info(`Fetched ${newTransactionsCount} new transactions for mint ${mintAddress}`);
      return newTransactionsCount;

    } catch (error) {
      logger.error(`Error fetching data for mint ${mintAddress}:`, error);
      throw error;
    }
  }

  static async fetchDataForAllMints(): Promise<Array<{ mint: string; newTransactions?: number; error?: string }>> {
    try {
      const mints = await Mint.getAll();
      const results: Array<{ mint: string; newTransactions?: number; error?: string }> = [];

      for (const mint of mints) {
        try {
          const count = await this.fetchDataForMint(mint.address);
          results.push({ mint: mint.address, newTransactions: count });
        } catch (error) {
          logger.error(`Failed to fetch data for mint ${mint.address}:`, error);
          results.push({ mint: mint.address, error: (error as Error).message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error fetching data for all mints:', error);
      throw error;
    }
  }
}