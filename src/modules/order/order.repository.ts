// ─── Order Repository ───────────────────────────────────────────────

import { prisma } from '../../config/database';

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
  statusTimeline: true,
  createdAt: true,
  updatedAt: true,
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

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      select: ORDER_SELECT,
    });
  },

  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      select: ORDER_SELECT,
    });
  },

  async list(tenantId: string, filters: {
    branchId?: string;
    status?: string;
    channel?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
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
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

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

  async updateStatus(id: string, status: string, timeline: any[]) {
    return prisma.order.update({
      where: { id },
      data: { status: status as any, statusTimeline: timeline },
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
