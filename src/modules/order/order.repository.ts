// ─── Order Repository ───────────────────────────────────────────────

import { prisma } from '../../config/database';
import { NotFoundError } from '../../lib/errors';

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  channel: true,
  fulfillmentType: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  deliveryFee: true,
  grandTotal: true,
  deliveryAddress: true,
  nearestLandmark: true,
  deliveryInstructions: true,
  tableNumber: true,
  specialInstructions: true,
  privateKitchenNotes: true,
  emailAddress: true,
  altMobileNumber: true,
  changeRequest: true,
  statusTimeline: true,
  createdAt: true,
  updatedAt: true,
  city: { select: { name: true } },
  zone: { select: { name: true } },
  area: { select: { name: true } },
  customer: {
    select: { id: true, name: true, phone: true, email: true },
  },
  branch: {
    select: { id: true, name: true },
  },
  items: {
    select: {
      id: true,
      itemName: true,
      unitPrice: true,
      quantity: true,
      selectedVariants: true,
      itemNote: true,
      totalPrice: true,
    },
  },
};

const ORDER_LIST_SELECT = {
  id: true,
  orderNumber: true,
  branchId: true,
  channel: true,
  fulfillmentType: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  deliveryFee: true,
  grandTotal: true,
  tableNumber: true,
  createdAt: true,
  customer: {
    select: { id: true, name: true, phone: true },
  },
  branch: {
    select: { id: true, name: true },
  },
  items: {
    select: {
      id: true,
      itemName: true,
      unitPrice: true,
      quantity: true,
      totalPrice: true,
    }
  },
  _count: { select: { items: true } },
};

export const orderRepository = {
  async create(data: any) {
    return prisma.order.create({
      data,
      select: ORDER_SELECT,
    });
  },

  async findById(idOrOrderNumber: string, tenantId: string) {
    // Accept both UUID and human-readable order number (e.g. GK-XXXXXX) so
    // the dashboard can fetch an order for printing/tracking by number.
    const byId = await prisma.order.findFirst({
      where: { id: idOrOrderNumber, tenantId },
      select: ORDER_SELECT,
    });
    if (byId) return byId;
    return prisma.order.findFirst({
      where: { orderNumber: idOrOrderNumber, tenantId },
      select: ORDER_SELECT,
    });
  },

  async findByOrderNumber(orderNumber: string, tenantId: string) {
    return prisma.order.findFirst({
      where: { orderNumber, tenantId },
      select: ORDER_SELECT,
    });
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.order.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError('Order', id);
    return prisma.order.delete({
      where: { id },
    });
  },

  async list(tenantId: string, filters: {
    branchId?: string;
    status?: string;
    channel?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    createdById?: string;
  }, skip: number, take: number) {
    const where: any = { tenantId };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) {
      let dbStatus = filters.status.toUpperCase();
      if (dbStatus === 'CONFIRMED') dbStatus = 'ACCEPTED';
      where.status = dbStatus;
    }
    if (filters.channel) where.channel = filters.channel;
    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filters.search } } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        // A date-only value (YYYY-MM-DD) should include the whole end day
        if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
          end.setDate(end.getDate() + 1);
        }
        where.createdAt.lt = end;
      }
    }
    if (filters.cashierId) where.createdById = filters.cashierId;
    if (filters.createdById) where.createdById = filters.createdById;

    const whereForCounts = { ...where };
    delete whereForCounts.status;

    const [orders, total, groupedStatuses, totalCountWithoutStatus] = await Promise.all([
      prisma.order.findMany({
        where,
        select: ORDER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        where: whereForCounts,
        _count: true,
      }),
      prisma.order.count({ where: whereForCounts }),
    ]);

    const statusCounts = groupedStatuses.reduce((acc, curr) => {
      let key = curr.status.toLowerCase();
      if (key === 'accepted') key = 'confirmed';
      acc[key] = curr._count;
      return acc;
    }, {} as Record<string, number>);
    statusCounts['all'] = totalCountWithoutStatus;

    return { orders, total, statusCounts };
  },

  async updateStatus(id: string, tenantId: string, status: string, timeline: any[]) {
    const existing = await prisma.order.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError('Order', id);
    return prisma.order.update({
      where: { id },
      data: { status: status as any, statusTimeline: timeline },
      select: ORDER_SELECT,
    });
  },

  async updatePayment(id: string, tenantId: string, data: { paymentStatus: 'PAID' | 'UNPAID'; paymentMethod?: string; timeline?: any[] }) {
    const existing = await prisma.order.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError('Order', id);
    return prisma.order.update({
      where: { id },
      data: {
        paymentStatus: data.paymentStatus,
        ...(data.paymentMethod
          ? { paymentMethod: data.paymentMethod as any }
          : {}),
        ...(data.timeline ? { statusTimeline: data.timeline } : {}),
      },
      select: ORDER_SELECT,
    });
  },

  async getActiveKitchenOrders(tenantId: string, branchId?: string) {
    const where: any = {
      tenantId,
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING'] },
    };
    if (branchId) where.branchId = branchId;

    return prisma.order.findMany({
      where,
      select: ORDER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  },

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn, { maxWait: 10000, timeout: 20000 });
  },
};
