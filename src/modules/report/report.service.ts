// ─── Report Service ─────────────────────────────────────────────────
import { prisma } from '../../config/database';
import { resolveReportingPeriod, buildWhereClauseForIntervals, ReportFilter } from '../../lib/reporting-period';

export const reportService = {
  async getSummary(tenantId: string, period: string, branchId?: string, userId?: string, cashierId?: string) {
    let reportFilter: ReportFilter;
    if (period === 'current-shift' || period === 'previous-shift') {
      reportFilter = { type: period, tenantId, branchId, userId: userId || '' };
    } else if (period === 'shift') {
      reportFilter = { type: 'shift', shiftId: '', tenantId, branchId }; // We don't have shiftId in query yet, but fallback
    } else {
      reportFilter = { type: 'calendar', preset: period as any, tenantId, branchId };
    }

    const periodResult = await resolveReportingPeriod(reportFilter);
    const dateWhere = buildWhereClauseForIntervals(periodResult.intervals);

    const where: any = {
      tenantId,
      ...dateWhere,
      status: { notIn: ['CANCELLED'] },
    };
    
    if (branchId) where.branchId = branchId;
    if (cashierId) where.createdById = cashierId;

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
