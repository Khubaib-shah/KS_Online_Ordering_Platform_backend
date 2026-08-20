import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

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
      // Only allow the configured dashboard origins; the desktop printer
      // service sends no Origin header and is unaffected by this.
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // ── Dashboard / POS / Kitchen clients join tenant/branch rooms ──
    // Each client joins exactly ONE room to match the single-room emit
    // strategy in emitOrderEvent — no client should be in both the
    // tenant room and a branch room simultaneously.
    socket.on('client:join', (data: { tenantId: string; branchId?: string }) => {
      const { tenantId, branchId } = data;
      if (!tenantId) return;

      if (branchId) {
        // Branch-specific view: join only the branch-scoped room
        socket.join(`tenant:${tenantId}:branch:${branchId}`);
        logger.info(`Client ${socket.id} joined tenant:${tenantId}:branch:${branchId}`);
      } else {
        // Tenant-wide view (e.g., multi-branch dashboard): join the tenant room
        socket.join(`tenant:${tenantId}`);
        logger.info(`Client ${socket.id} joined tenant:${tenantId}`);
      }
    });

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

        if (!deviceId || !tenantId || !branchId) {
          socket.emit('error', { message: 'deviceId, tenantId and branchId are required' });
          return;
        }

        // Server-side validation — never trust client-supplied tenant/branch.
        const branch = await prisma.branch.findFirst({
          where: { id: branchId, tenantId },
          select: { id: true },
        });
        if (!branch) {
          socket.emit('error', { message: 'Invalid tenant/branch combination' });
          return;
        }

        // Anti-hijack: a deviceId already paired to a different tenant/branch
        // must not be able to take over this socket slot.
        const existing = await prisma.posDevice.findUnique({
          where: { deviceId },
          select: { tenantId: true, branchId: true },
        });
        if (existing && (existing.tenantId !== tenantId || existing.branchId !== branchId)) {
          socket.emit('error', { message: 'Device is already paired to a different branch. Unpair it first.' });
          return;
        }

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

    // Printer service reports the outcome of a dispatched print job
    socket.on('print:status', async (data: { jobId: string; status: string; error?: string }) => {
      try {
        if (!data.jobId || !data.status) return;

        const job = await prisma.printJob.findUnique({
          where: { id: data.jobId },
        });
        if (!job) return;

        await prisma.printJob.update({
          where: { id: data.jobId },
          data: { status: data.status, error: data.error || null },
        });

        // Archive the outcome for audit/reporting
        await prisma.printHistory.create({
          data: {
            tenantId: job.tenantId,
            branchId: job.branchId,
            type: job.type,
            status: data.status,
            payload: job.payload as any,
            error: data.error || null,
          },
        });

        logger.info(`Print job ${data.jobId} -> ${data.status}`);
      } catch (error: any) {
        logger.error('Error recording print status:', error?.message || error);
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

// ── Real-Time Order Events ──────────────────────────────────────────
// Emits an order event to connected dashboard / POS / kitchen clients.
//
// Routing strategy — emit to exactly ONE room to avoid duplicate events
// on clients that have joined both a branch room and the tenant room:
//
//   • branchId known  →  tenant:{tenantId}:branch:{branchId}
//     Branch-filtered clients join this room and receive only their orders.
//
//   • branchId unknown →  tenant:{tenantId}
//     Tenant-wide / multi-branch clients (no branch filter) join this room.
//
// A client that has joined both rooms (shouldn't happen by design, but)
// would only receive the event once because we emit to one room only.
//
// Tenant isolation is guaranteed because room names embed tenantId.
// A client in tenant:A cannot receive events emitted to tenant:B rooms.
export function emitOrderEvent(
  event: 'order:new' | 'order:updated',
  tenantId: string,
  branchId: string | null | undefined,
  payload: Record<string, unknown>
): void {
  if (!io) return; // Socket.IO not yet initialized (e.g., during tests)

  const data = { ...payload, tenantId, branchId };

  if (branchId) {
    io.to(`tenant:${tenantId}:branch:${branchId}`).emit(event, data);
    logger.info(`[socket] ${event} → tenant:${tenantId}:branch:${branchId}`);
  } else {
    // No branch context — emit to the tenant-wide room
    io.to(`tenant:${tenantId}`).emit(event, data);
    logger.info(`[socket] ${event} → tenant:${tenantId}`);
  }

  logger.info(`[socket] ${event} → tenant:${tenantId}${branchId ? `:branch:${branchId}` : ''}`);
}
