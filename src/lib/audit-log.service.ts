// ─── Audit Log Service ──────────────────────────────────────────────
// Records significant mutations for security audit trail.
// Only logs mutations (creates, updates, deletes), never reads.

import { prisma } from '../config/database';

interface AuditEntry {
  tenantId: string;
  branchId?: string | null;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
}

export const auditLogService = {
  /**
   * Record a single audit log entry. Fire-and-forget — never throws to avoid
   * breaking the primary operation if logging fails.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          branchId: entry.branchId || null,
          actorId: entry.actorId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          metadata: entry.metadata || {},
        },
      });
    } catch (error) {
      // Log but never throw — audit failure should not block the operation
      console.error('[AuditLog] Failed to record entry:', error);
    }
  },

  /**
   * Fetch audit logs for a specific actor (staff activity view).
   */
  async getByActor(tenantId: string, actorId: string, options?: {
    page?: number;
    limit?: number;
    module?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, actorId };
    if (options?.module) {
      where.targetType = options.module;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options?.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  },

  /**
   * Fetch tenant-wide audit logs (admin audit log page).
   */
  async getByTenant(tenantId: string, options?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    branchId?: string | null;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (options?.action) where.action = options.action;
    if (options?.actorId) where.actorId = options.actorId;
    if (options?.targetType) where.targetType = options.targetType;
    if (options?.branchId) where.branchId = options.branchId;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options?.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Enrich logs with Actor Name
    const actorIds = [...new Set(logs.map(l => l.actorId))];
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    // Enrich logs with Target Display (e.g., Order number)
    const orderIds = logs.filter(l => l.targetType === 'Order').map(l => l.targetId);
    let orderMap = new Map<string, string>();
    if (orderIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true }
      });
      orderMap = new Map(orders.map(o => [o.id, o.orderNumber]));
    }

    const enrichedLogs = logs.map(log => {
      let targetDisplay = log.targetId;
      if (log.targetType === 'Order' && orderMap.has(log.targetId)) {
        targetDisplay = orderMap.get(log.targetId)!;
      }
      return {
        ...log,
        actorName: userMap.get(log.actorId) || 'Unknown User',
        targetDisplay,
      };
    });

    return { logs: enrichedLogs, total, page, limit };
  },
};
