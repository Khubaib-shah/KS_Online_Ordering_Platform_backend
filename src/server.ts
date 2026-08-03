// ─── Server Entry Point ─────────────────────────────────────────────

import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { createServer } from 'http';
import { initSocketIO } from './modules/printer/printer.socket';

const PORT = env.PORT;

const server = createServer(app);

// Initialize Socket.io
initSocketIO(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`API: http://localhost:${PORT}/api/v1`);
  logger.info(`Health: http://localhost:${PORT}/api/v1/health`);
  logger.info(`Socket.IO Server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});
