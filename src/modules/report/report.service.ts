// ─── Report Service ─────────────────────────────────────────────────
import { prisma } from '../../config/database';

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

export const reportService = {
  async getSummary(tenantId: string, period: string, branchId?: string, userId?: string) {
    let periodStart = getPeriodStart(period);
    let periodEnd = undefined;

    if (period === 'shift' && userId) {
      const activeShift = await prisma.cashierShift.findFirst({
        where: { userId },
        orderBy: { startTime: 'desc' }
      });
      if (activeShift) {
        periodStart = activeShift.startTime;
        if (activeShift.endTime) {
          periodEnd = activeShift.endTime;
        }
      }
    }

    const where: any = {
      tenantId,
      createdAt: { gte: periodStart },
      status: { notIn: ['CANCELLED'] },
    };
    if (periodEnd) {
      where.createdAt.lte = periodEnd;
    }
    if (branchId) where.branchId = branchId;

    // Aggregate queries
    const [
      orderStats,
      paymentBreakdown,
      channelBreakdown,
      topItems,
      recentOrders,
    ] = await Promise.all([
      // Total revenue, order count, avg order value
      prisma.order.aggregate({
        where,
        _sum: { grandTotal: true, taxAmount: true, discountAmount: true, deliveryFee: true },
        _count: true,
        _avg: { grandTotal: true },
      }),
      // Payment method breakdown
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { grandTotal: true },
        _count: true,
      }),
      // Channel breakdown (POS vs Website)
      prisma.order.groupBy({
        by: ['channel'],
        where,
        _sum: { grandTotal: true },
        _count: true,
      }),
      // Top selling items
      prisma.orderItem.groupBy({
        by: ['itemName'],
        where: { order: where },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      // Recent orders
      prisma.order.findMany({
        where,
        select: {
          orderNumber: true, grandTotal: true, status: true, channel: true, createdAt: true,
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      period,
      revenue: {
        gross: orderStats._sum.grandTotal || 0,
        tax: orderStats._sum.taxAmount || 0,
        discounts: orderStats._sum.discountAmount || 0,
        deliveryFees: orderStats._sum.deliveryFee || 0,
      },
      orders: {
        total: orderStats._count,
        averageValue: orderStats._avg.grandTotal || 0,
      },
      paymentBreakdown: paymentBreakdown.map(p => ({
        method: p.paymentMethod,
        total: p._sum.grandTotal,
        count: p._count,
      })),
      channelBreakdown: channelBreakdown.map(c => ({
        channel: c.channel,
        total: c._sum.grandTotal,
        count: c._count,
      })),
      topItems: topItems.map(i => ({
        name: i.itemName,
        quantitySold: i._sum.quantity,
        revenue: i._sum.totalPrice,
      })),
      recentOrders,
    };
  },
};
