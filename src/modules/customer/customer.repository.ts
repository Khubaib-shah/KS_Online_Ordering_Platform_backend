// ─── Customer Repository ────────────────────────────────────────────

import { prisma } from '../../config/database';

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isGuest: true,
  loyaltyPoints: true,
  tier: true,
  totalOrders: true,
  totalSpent: true,
  createdAt: true,
};

export const customerRepository = {
  async list(tenantId: string, filters: { search?: string; tier?: string }, skip: number, take: number) {
    const where: any = { tenantId };
    if (filters.tier) where.tier = filters.tier;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: CUSTOMER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  },

  async findById(id: string, tenantId: string) {
    return prisma.customer.findFirst({
      where: { id, tenantId },
      select: {
        ...CUSTOMER_SELECT,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            grandTotal: true,
            status: true,
            channel: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  },
};
