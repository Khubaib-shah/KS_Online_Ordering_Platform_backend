import pino from 'pino';
import { env } from './env';

const pinoLogger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    meta ? pinoLogger.info(meta, message) : pinoLogger.info(message);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    meta ? pinoLogger.warn(meta, message) : pinoLogger.warn(message);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    meta ? pinoLogger.error(meta, message) : pinoLogger.error(message);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    meta ? pinoLogger.debug(meta, message) : pinoLogger.debug(message);
  },
};
