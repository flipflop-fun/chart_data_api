import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mint-price-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
//   logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
//   logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
// }

export default logger;