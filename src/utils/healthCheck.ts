import pool from '../config/database';
// import redisClient from '../config/redis';
import logger from '../config/logger';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  timestamp: Date;
}

export class HealthChecker {
  static async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      
      return {
        service: 'database',
        status: 'healthy',
        message: `Connected at ${result.rows[0].current_time}`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // static async checkRedis(): Promise<HealthCheckResult> {
  //   try {
  //     const pong = await redisClient.ping();
  //     return {
  //       service: 'redis',
  //       status: pong === 'PONG' ? 'healthy' : 'unhealthy',
  //       message: `Response: ${pong}`,
  //       timestamp: new Date()
  //     };
  //   } catch (error) {
  //     return {
  //       service: 'redis',
  //       status: 'unhealthy',
  //       message: error instanceof Error ? error.message : 'Unknown error',
  //       timestamp: new Date()
  //     };
  //   }
  // }

  static async checkAllServices(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
      this.checkDatabase(),
      // this.checkRedis()
    ]);
    
    checks.forEach(check => {
      if (check.status === 'healthy') {
        logger.info(`${check.service} health check: ${check.status} - ${check.message}`);
      } else {
        logger.error(`${check.service} health check: ${check.status} - ${check.message}`);
      }
    });
    
    return checks;
  }

  static async waitForServices(maxRetries: number = 5, retryDelay: number = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const checks = await this.checkAllServices();
      const allHealthy = checks.every(check => check.status === 'healthy');
      
      if (allHealthy) {
        logger.info('All services are healthy');
        return true;
      }
      
      if (i < maxRetries - 1) {
        logger.warn(`Services not ready, retrying in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    logger.error('Services failed to become healthy after maximum retries');
    return false;
  }
}