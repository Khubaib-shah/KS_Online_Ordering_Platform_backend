import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';

let io: Server;

// In-memory map of pending devices waiting to be paired
// Key: pairingCode (e.g., "4921"), Value: { socketId, deviceId, computerName, ... }
const pendingDevices = new Map<string, {
  socketId: string;
  deviceId: string;
  computerName?: string;
  version?: string;
  os?: string;
  localIp?: string;
}>();

export const initSocketIO = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust based on security requirements
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // ── Register a fully paired POS device ──
    socket.on('device:connect', async (data: {
      deviceId: string;
      tenantId: string;
      branchId: string;
      computerName?: string;
      version?: string;
      os?: string;
      localIp?: string;
    }) => {
      try {
        const { deviceId, tenantId, branchId, computerName, version, os, localIp } = data;

        await prisma.posDevice.upsert({
          where: { deviceId },
          update: {
            socketId: socket.id,
            status: 'online',
            lastSeen: new Date(),
            computerName: computerName || null,
            version: version || null,
            os: os || null,
            localIp: localIp || null,
          },
          create: {
            deviceId,
            tenantId,
            branchId,
            socketId: socket.id,
            status: 'online',
            computerName: computerName || null,
            version: version || null,
            os: os || null,
            localIp: localIp || null,
          }
        });

        logger.info(`Device registered: ${deviceId} at socket ${socket.id}`);
        socket.emit('device:ready', { status: 'ok' });
      } catch (error: any) {
        logger.error(`Error registering device`, error?.message || error);
        socket.emit('error', { message: 'Registration failed', detail: error?.message });
      }
    });

    // ── Register a pending (unpaired) device ──
    socket.on('device:pending', (data: {
      deviceId: string;
      pairingCode: string;
      computerName?: string;
      version?: string;
      os?: string;
      localIp?: string;
    }) => {
      const { deviceId, pairingCode, computerName, version, os, localIp } = data;

      // Store in pending map
      pendingDevices.set(pairingCode, {
        socketId: socket.id,
        deviceId,
        computerName,
        version,
        os,
        localIp,
      });

      logger.info(`Device pending pairing: ${deviceId} (Code: ${pairingCode}) at socket ${socket.id}`);
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

      // Remove from pending devices if it was pending
      for (const [code, device] of pendingDevices.entries()) {
        if (device.socketId === socket.id) {
          pendingDevices.delete(code);
          logger.info(`Removed pending device with code: ${code}`);
          break;
        }
      }

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

// ── Pairing Helper ──
// Called by the REST API when a user enters a pairing code on the POS dashboard
export async function pairDeviceByCode(
  pairingCode: string,
  tenantId: string,
  branchId: string
): Promise<{ success: boolean; message: string; deviceId?: string }> {
  const pending = pendingDevices.get(pairingCode);

  if (!pending) {
    return { success: false, message: 'Invalid or expired pairing code. Make sure the printer service is running.' };
  }

  const { socketId, deviceId, computerName, version, os, localIp } = pending;

  try {
    // Upsert the POS device record in the database
    await prisma.posDevice.upsert({
      where: { deviceId },
      update: {
        tenantId,
        branchId,
        socketId,
        status: 'online',
        lastSeen: new Date(),
        computerName: computerName || null,
        version: version || null,
        os: os || null,
        localIp: localIp || null,
      },
      create: {
        deviceId,
        tenantId,
        branchId,
        socketId,
        status: 'online',
        computerName: computerName || null,
        version: version || null,
        os: os || null,
        localIp: localIp || null,
      }
    });

    // Look up names for a friendly confirmation
    let tenantName: string | undefined;
    let branchName: string | undefined;
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
      const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
      tenantName = tenant?.name;
      branchName = branch?.name;
    } catch (e) {
      // Non-critical
    }

    // Send the pairing confirmation to the printer service via Socket
    io.to(socketId).emit('device:paired', {
      tenantId,
      branchId,
      tenantName,
      branchName,
    });

    // Remove from pending map
    pendingDevices.delete(pairingCode);

    logger.info(`Device ${deviceId} paired to tenant ${tenantId}, branch ${branchId}`);

    return {
      success: true,
      message: `Printer paired successfully${branchName ? ` to ${branchName}` : ''}!`,
      deviceId,
    };
  } catch (error: any) {
    logger.error('Error pairing device:', error?.message || error);
    return { success: false, message: 'Failed to pair device. Please try again.' };
  }
}

// ── Get Pending Devices (for debug/admin) ──
export function getPendingDevices() {
  const devices: Array<{ pairingCode: string; deviceId: string; computerName?: string }> = [];
  for (const [code, device] of pendingDevices.entries()) {
    devices.push({ pairingCode: code, deviceId: device.deviceId, computerName: device.computerName });
  }
  return devices;
}
