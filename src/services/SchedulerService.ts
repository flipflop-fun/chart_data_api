import schedule from 'node-schedule';
import { DataFetchService } from './DataFetchService';
import { OHLCService } from './OHLCService';
import logger from '../config/logger';

export class SchedulerService {
  private static dataFetchJob: schedule.Job | null = null;
  private static ohlcGenerationJob: schedule.Job | null = null;

  static init(): void {
    try {
      // Schedule data fetching every 2 minutes
      this.dataFetchJob = schedule.scheduleJob('*/2 * * * *', async () => {
        logger.info(`Starting scheduled data fetch at ${new Date().toISOString()}...`);
        try {
          const totalFetched = await DataFetchService.fetchDataForAllMints();
          logger.info(`Scheduled data fetch completed. Total new transactions: ${totalFetched}`);
        } catch (error) {
          logger.error('Error in scheduled data fetch:', error);
        }
      });

      // Schedule OHLC generation every 5 minutes
      this.ohlcGenerationJob = schedule.scheduleJob('*/3 * * * *', async () => {
        logger.info(`Starting scheduled OHLC generation at ${new Date().toISOString()}...`);
        try {
          const totalGenerated = await OHLCService.generateOHLCForAllMints();
          logger.info(`Scheduled OHLC generation completed. Total records generated: ${totalGenerated}`);
        } catch (error) {
          logger.error('Error in scheduled OHLC generation:', error);
        }
      });

      logger.info('Scheduler service initialized successfully');
    } catch (error) {
      logger.error('Error initializing scheduler service:', error);
      throw error;
    }
  }

  static stop(): void {
    try {
      if (this.dataFetchJob) {
        this.dataFetchJob.cancel();
        this.dataFetchJob = null;
        logger.info('Data fetch job stopped');
      }

      if (this.ohlcGenerationJob) {
        this.ohlcGenerationJob.cancel();
        this.ohlcGenerationJob = null;
        logger.info('OHLC generation job stopped');
      }

      logger.info('Scheduler service stopped successfully');
    } catch (error) {
      logger.error('Error stopping scheduler service:', error);
    }
  }

  static getStatus(): {
    dataFetchJob: boolean;
    ohlcGenerationJob: boolean;
  } {
    return {
      dataFetchJob: this.dataFetchJob !== null,
      ohlcGenerationJob: this.ohlcGenerationJob !== null
    };
  }
}