import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';

let io: Server;

export const initSocketIO = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust based on security requirements
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Register POS device
    socket.on('device:connect', async (data: { deviceId: string, tenantId: string, branchId: string }) => {
      try {
        const { deviceId, tenantId, branchId } = data;

        await prisma.posDevice.upsert({
          where: { deviceId },
          update: {
            socketId: socket.id,
            status: 'online',
            lastSeen: new Date(),
          },
          create: {
            deviceId,
            tenantId,
            branchId,
            socketId: socket.id,
            status: 'online',
          }
        });

        logger.info(`Device registered: ${deviceId} at socket ${socket.id}`);
        socket.emit('device:ready', { status: 'ok' });
      } catch (error: any) {
        logger.error(`Error registering device`, error?.message || error);
        socket.emit('error', { message: 'Registration failed', detail: error?.message });
      }
    });

    // Heartbeat
    socket.on('device:heartbeat', async (data: { deviceId: string, status: string }) => {
      try {
        await prisma.posDevice.update({
          where: { deviceId: data.deviceId },
          data: {
            status: data.status,
            lastSeen: new Date(),
          }
        });
      } catch (error) {
        // Ignore heartbeat errors if device deleted
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      try {
        await prisma.posDevice.updateMany({
          where: { socketId: socket.id },
          data: {
            status: 'offline',
            socketId: null
          }
        });
      } catch (error: any) {
        logger.error(`Error handling disconnect for ${socket.id}`, error?.message || error);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
