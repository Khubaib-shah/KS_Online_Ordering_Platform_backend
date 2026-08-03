import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

export const loggerMiddleware = pinoHttp({
  // Use our custom pino instance if needed, or pass the same configuration
  // For simplicity, we just use pino-http's default which integrates nicely.
  logger: require('pino')(), // or just rely on pino-http's default
  // Add request id to the logs
  genReqId: function (req, res) {
    const existingID = req.id ?? req.headers["x-request-id"]
    if (existingID) return existingID
    const id = require('crypto').randomUUID()
    res.setHeader('X-Request-Id', id)
    return id
  },
});
