import winston from 'winston';
import { env } from './env';

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [notification] [${level}]: ${message} ${metaStr}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

export { env };
