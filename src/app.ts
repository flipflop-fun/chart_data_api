import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import logger from './config/logger';
import redisClient from './config/redis';
import { SchedulerService } from './services/SchedulerService';
import apiRoutes from './routes/api';
import { HealthChecker } from './utils/healthCheck';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '9090');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1', apiRoutes);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  SchedulerService.stop();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  SchedulerService.stop();
  await redisClient.quit();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  const servicesReady = await HealthChecker.waitForServices(5, 2000);
  
  if (!servicesReady) {
    logger.error('Critical services are not available. Exiting...');
    process.exit(1);
  }

  // Initialize scheduler
  SchedulerService.init();
});

export default app;