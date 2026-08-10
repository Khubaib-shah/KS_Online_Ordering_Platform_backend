// ─── Print Job Dispatch ─────────────────────────────────────────────
// Creates a PrintJob record and pushes it to every online POS device
// registered for the branch via Socket.IO. Failures are logged and
// swallowed — printing must never break the order flow.

import { prisma } from '../../config/database';
import { getIO } from './printer.socket';
import { logger } from '../../config/logger';

export type PrintJobType = 'RECEIPT' | 'KITCHEN_DOCKET';

export interface PrintJobPayload {
  orderId: string;
  orderNumber: string;
  channel: string;
  fulfillmentType: string;
  status: string;
  tableNumber?: string | null;
  customerName?: string;
  customerPhone?: string;
  items: {
    name: string;
    qty: number;
    total: number;
    variants?: string[];
    note?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus?: string;
  printerName?: string | null;
  printedAt: string;
}

function buildPayloadFromOrder(order: any, extra?: { printerName?: string | null }): PrintJobPayload {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    channel: order.channel,
    fulfillmentType: order.fulfillmentType,
    status: order.status,
    tableNumber: order.tableNumber ?? null,
    customerName: order.customer?.name,
    customerPhone: order.customer?.phone,
    items: (order.items || []).map((item: any) => ({
      name: item.itemName,
      qty: item.quantity,
      total: Number(item.totalPrice),
      variants: Array.isArray(item.selectedVariants)
        ? (item.selectedVariants as any[]).map((sv: any) => sv.optionName).filter(Boolean)
        : undefined,
      note: item.itemNote || undefined,
    })),
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    deliveryFee: Number(order.deliveryFee),
    discountAmount: Number(order.discountAmount),
    grandTotal: Number(order.grandTotal),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    printerName: extra?.printerName ?? null,
    printedAt: new Date().toISOString(),
  };
}

export const printJobService = {
  buildPayloadFromOrder,

  async dispatch(tenantId: string, branchId: string, type: PrintJobType, payload: PrintJobPayload): Promise<string | null> {
    try {
      const devices = await prisma.posDevice.findMany({
        where: { tenantId, branchId, status: 'online', socketId: { not: null } },
        select: { socketId: true },
      });

      const job = await prisma.printJob.create({
        data: {
          tenantId,
          branchId,
          type,
          status: devices.length > 0 ? 'dispatched' : 'pending',
          payload: payload as any,
        },
        select: { id: true },
      });

      if (devices.length === 0) {
        logger.info(`[PRINT] No online devices for branch ${branchId}; job ${job.id} queued as pending`);
        return job.id;
      }

      const io = getIO();
      for (const device of devices) {
        io.to(device.socketId!).emit('print:job', {
          id: job.id,
          type: type.toLowerCase(),
          payload,
        });
      }
      logger.info(`[PRINT] Dispatched ${type} job ${job.id} to ${devices.length} device(s)`);
      return job.id;
    } catch (error: any) {
      logger.error('[PRINT] Failed to dispatch print job:', error?.message || error);
      return null;
    }
  },

  /**
   * Convenience: dispatch a docket/receipt straight from a created/updated order.
   */
  async dispatchForOrder(
    tenantId: string,
    branchId: string,
    order: any,
    types: PrintJobType[],
    extra?: { printerName?: string | null }
  ): Promise<void> {
    if (!branchId || !order) return;
    const payload = buildPayloadFromOrder(order, extra);
    for (const type of types) {
      await this.dispatch(tenantId, branchId, type, payload);
    }
  },
};
