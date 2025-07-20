import express from 'express';
import Joi from 'joi';
import { Mint } from '../models/Mint';
import { Transaction } from '../models/Transaction';
import { OHLCData } from '../models/OHLCData';
import { DataFetchService } from '../services/DataFetchService';
import { OHLCService } from '../services/OHLCService';
import { SchedulerService } from '../services/SchedulerService';
import redisClient from '../config/redis';
import logger from '../config/logger';
import { APIResponse, OHLCQueryParams, TransactionQueryParams } from '../types';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Validation schemas
const mintAddressSchema = Joi.object({
  mintAddress: Joi.string().required().min(32).max(44)
});

const ohlcQuerySchema = Joi.object({
  period: Joi.string().valid('5m', '15m', '30m', '1h', '4h', '1d').required(),
  from: Joi.number().integer().min(0).optional(),
  to: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100)
});

const transactionQuerySchema = Joi.object({
  from: Joi.number().integer().min(0).optional(),
  to: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100)
});

// Helper function to generate cache key
const generateCacheKey = (network: string, prefix: string, ...parts: string[]): string => {
  return `${network}:${prefix}:${parts.join(':')}`;
};

// Helper function to handle async route errors
const asyncHandler = (fn: Function) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// API key authentication middleware
const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.header('x-api-key');

  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

  if (validApiKeys.length === 0) {
    return res.status(503).json({
      success: false,
      error: 'Admin operations are not configured'
    });
  }

  if (!validApiKeys.includes(apiKey || '')) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key'
    });
  }
  
  return next();
};

// Admin authentication middleware
const authenticateAdminApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.header('x-api-key');
  const validAdminApiKeys = process.env.ADMIN_API_KEYS ? process.env.ADMIN_API_KEYS.split(',') : [];

  if (validAdminApiKeys.length === 0) {
    return res.status(503).json({
      success: false,
      error: 'Admin operations are not configured'
    });
  }

  if (!validAdminApiKeys.includes(apiKey || '')) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required for this operation'
    });
  }
  
  return next();
};

// Get scheduler status
router.get('/status/scheduler', authenticateApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    const status = SchedulerService.getStatus();
    
    return res.json({
      success: true,
      data: {
        scheduler: status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      cached: false
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching scheduler status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
}));

// Get system health status (comprehensive status check)
router.get('/status/health', authenticateApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    const schedulerStatus = SchedulerService.getStatus();
    
    // Check Redis connection
    let redisStatus = false;
    try {
      await redisClient.ping();
      redisStatus = true;
    } catch (redisError) {
      logger.warn('Redis health check failed:', redisError);
    }

    // Check database connection (you can add database ping here if needed)
    const dbStatus = true; // Placeholder - implement actual DB health check

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        scheduler: {
          status: schedulerStatus.dataFetchJob && schedulerStatus.ohlcGenerationJob ? 'running' : 'partial',
          jobs: schedulerStatus
        },
        redis: {
          status: redisStatus ? 'connected' : 'disconnected'
        },
        database: {
          status: dbStatus ? 'connected' : 'disconnected'
        }
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      }
    };

    // Determine overall health status
    const isHealthy = schedulerStatus.dataFetchJob && 
                      schedulerStatus.ohlcGenerationJob && 
                      redisStatus && 
                      dbStatus;

    healthData.status = isHealthy ? 'healthy' : 'degraded';

    return res.json({
      success: true,
      data: healthData,
      cached: false
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching health status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as APIResponse);
  }
}));

// Get all available mints
router.get('/mints', authenticateApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    const cacheKey = generateCacheKey(process.env.NETWORK || 'mainnet', 'mints:all');
    
    // Check cache first
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info('Cache hit for mints list');
        return res.json({
          success: true,
          data: JSON.parse(cachedData),
          cached: true
        } as APIResponse);
      }
    } catch (cacheError) {
      logger.warn('Redis cache error:', cacheError);
    }

    // Fetch all mints
    const mints = await Mint.getAll();

    // Cache the result for 10 minutes
    try {
      await redisClient.setex(cacheKey, 600, JSON.stringify(mints));
    } catch (cacheError) {
      logger.warn('Failed to cache mints data:', cacheError);
    }

    return res.json({
      success: true,
      data: mints,
      cached: false
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching mints:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
}));

// Get transaction data for a specific mint
router.get('/transactions/:mintAddress', authenticateApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    // Validate mint address
    const { error: mintError } = mintAddressSchema.validate({ mintAddress: req.params.mintAddress });
    if (mintError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint address',
        details: mintError.details[0].message
      } as APIResponse);
    }

    // Validate query parameters
    const { error: queryError, value: queryParams } = transactionQuerySchema.validate(req.query);
    if (queryError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryError.details[0].message
      } as APIResponse);
    }

    const { mintAddress } = req.params;
    const { from, to, limit } = queryParams as TransactionQueryParams;

    // Check cache first
    const cacheKey = generateCacheKey(process.env.NETWORK || 'mainnet', 'transactions', mintAddress, String(from || ''), String(to || ''), String(limit));
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for transaction data: ${cacheKey}`);
        return res.json({
          success: true,
          data: JSON.parse(cachedData),
          cached: true
        } as APIResponse);
      }
    } catch (cacheError) {
      logger.warn('Redis cache error:', cacheError);
    }

    // Check if mint exists
    const mint = await Mint.findByAddress(mintAddress);
    if (!mint) {
      return res.status(404).json({
        success: false,
        error: 'Mint not found'
      } as APIResponse);
    }

    // Fetch transaction data
    const transactions = await Transaction.findByMintId(mint.address, { from, to, limit });

    // Cache the result for 2 minutes
    try {
      await redisClient.setex(cacheKey, 120, JSON.stringify(transactions));
    } catch (cacheError) {
      logger.warn('Failed to cache transaction data:', cacheError);
    }

    return res.json({
      success: true,
      data: transactions,
      cached: false
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching transaction data:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
}));

// Manual trigger for data fetching (for debugging/admin purposes)
router.post('/transaction/fetch/:mintAddress', authenticateAdminApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    const { error } = mintAddressSchema.validate({ mintAddress: req.params.mintAddress });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint address',
        details: error.details[0].message
      } as APIResponse);
    }

    const { mintAddress } = req.params;
    
    logger.info(`Manual data fetch triggered for mint: ${mintAddress}`);
    const newTransactions = await DataFetchService.fetchDataForMint(mintAddress);
    
    return res.json({
      success: true,
      data: {
        mintAddress,
        newTransactions
      }
    } as APIResponse);

  } catch (error) {
    logger.error('Error in manual data fetch:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
}));

// Get OHLC data for a specific mint
router.get('/ohlc/:mintAddress', authenticateApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    // Validate mint address
    const { error: mintError } = mintAddressSchema.validate({ mintAddress: req.params.mintAddress });
    if (mintError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint address',
        details: mintError.details[0].message
      } as APIResponse);
    }

    // Validate query parameters
    const { error: queryError, value: queryParams } = ohlcQuerySchema.validate(req.query);
    if (queryError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryError.details[0].message
      } as APIResponse);
    }

    const { mintAddress } = req.params;
    const { period, from, to, limit } = queryParams as OHLCQueryParams;

    // Check cache first
    const cacheKey = generateCacheKey(process.env.NETWORK || 'mainnet', 'ohlc', mintAddress, period, String(from || ''), String(to || ''), String(limit));
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for OHLC data: ${cacheKey}`);
        return res.json({
          success: true,
          data: JSON.parse(cachedData),
          cached: true
        } as APIResponse);
      }
    } catch (cacheError) {
      logger.warn('Redis cache error:', cacheError);
    }

    // Check if mint exists
    const mint = await Mint.findByAddress(mintAddress);
    if (!mint) {
      return res.status(404).json({
        success: false,
        error: 'Mint not found'
      } as APIResponse);
    }

    // Fetch OHLC data
    const ohlcData = await OHLCData.findByMintAndPeriod(mint.address, period, { from, to, limit });

    // Cache the result for 5 minutes
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(ohlcData));
    } catch (cacheError) {
      logger.warn('Failed to cache OHLC data:', cacheError);
    }

    return res.json({
      success: true,
      data: ohlcData,
      cached: false
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching OHLC data:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as APIResponse);
  }
}));

// Rebuild OHLC data for a specific mint (Admin only)
router.post('/ohlc/rebuild/:mintAddress', authenticateAdminApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    // Validate mint address
    const { error: mintError } = mintAddressSchema.validate({ mintAddress: req.params.mintAddress });
    if (mintError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint address',
        details: mintError.details[0].message
      } as APIResponse);
    }

    const { mintAddress } = req.params;
    const { period } = req.body; // Optional parameter
    
    // Validate period if provided
    if (period && !['5m', '15m', '30m', '1h', '4h', '1d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: 5m, 15m, 30m, 1h, 4h, 1d'
      } as APIResponse);
    }
    
    logger.info(`Admin OHLC rebuild triggered for mint: ${mintAddress}, period: ${period || 'all'}`);
    const updatedPeriods = await OHLCService.rebuildOHLCForMint(mintAddress, period);
    
    return res.json({
      success: true,
      data: {
        mintAddress,
        updatedPeriods,
        message: `Successfully rebuilt OHLC data for mint ${mintAddress}`
      },
      cached: false
    } as APIResponse);
  } catch (error) {
    logger.error('Error rebuilding OHLC for mint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as APIResponse);
  }
}));

// Rebuild OHLC data for all mints (Admin only)
router.post('/ohlc/rebuild-all', authenticateAdminApiKey, asyncHandler(async (req: express.Request, res: express.Response): Promise<express.Response> => {
  try {
    logger.info('Admin OHLC rebuild triggered for all mints');
    const totalRebuilt = await OHLCService.rebuildOHLCForAllMints();
    
    return res.json({
      success: true,
      data: {
        totalRebuilt,
        message: `Successfully rebuilt OHLC data for all mints`
      },
      cached: false
    } as APIResponse);
  } catch (error) {
    logger.error('Error rebuilding OHLC for all mints:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as APIResponse);
  }
}));

export default router;