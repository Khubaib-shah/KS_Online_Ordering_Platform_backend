import { prisma } from '../../config/database';

// Helper to calculate analytics data points exactly like the frontend did, but dynamically in DB or post-processing
export function getAnalyticsPointsFromOrders(orders: any[], filter: string, metric: 'revenue' | 'orders') {
  const points: { label: string; value: number }[] = [];
  const now = new Date();

  if (filter === 'today' || filter === 'yesterday') {
    const labels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
    const values = new Array(12).fill(0);

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.placedAt);
      const hour = date.getHours(); // 0-23
      const slotIdx = Math.floor(hour / 2); // 0-11
      const val = metric === 'revenue' ? (o.status !== 'CANCELLED' ? (o.grandTotal ? Number(o.grandTotal) : 0) : 0) : 1;
      values[slotIdx] += val;
    });

    for (let i = 0; i < 12; i++) {
      points.push({ label: labels[i], value: values[i] });
    }
  } else if (filter === '7d') {
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const values = [0, 0, 0, 0, 0, 0, 0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.placedAt);
      const diffDays = Math.floor((date.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const val = metric === 'revenue' ? (o.status !== 'CANCELLED' ? (o.grandTotal ? Number(o.grandTotal) : 0) : 0) : 1;
        values[diffDays] += val;
      }
    });

    for (let i = 0; i < 7; i++) {
      points.push({ label: labels[i], value: values[i] });
    }
  } else if (filter === '30d' || filter === 'month') {
    const labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    const values = [0, 0, 0, 0];
    let startDate: Date;

    if (filter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.placedAt);
      const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      let slotIdx = Math.floor(diffDays / 7.5);
      if (slotIdx > 3) slotIdx = 3;
      if (slotIdx >= 0) {
        const val = metric === 'revenue' ? (o.status !== 'CANCELLED' ? (o.grandTotal ? Number(o.grandTotal) : 0) : 0) : 1;
        values[slotIdx] += val;
      }
    });

    for (let i = 0; i < 4; i++) {
      points.push({ label: labels[i], value: values[i] });
    }
  } else {
    // year
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const values = new Array(12).fill(0);

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.placedAt);
      const month = date.getMonth();
      const val = metric === 'revenue' ? (o.status !== 'CANCELLED' ? (o.grandTotal ? Number(o.grandTotal) : 0) : 0) : 1;
      values[month] += val;
    });

    for (let i = 0; i < 12; i++) {
      points.push({ label: labels[i], value: values[i] });
    }
  }

  // Find max value to determine badge highlight style on frontend
  const maxValue = Math.max(...points.map(p => p.value));
  return points.map(p => ({
    day: p.label,
    value: p.value,
    fillStyle: p.value === maxValue && maxValue > 0 ? 'solid-dark' : 'solid-light',
    highlightBadge: p.value === maxValue && maxValue > 0 ? (metric === 'revenue' ? `Rs. ${p.value}` : p.value.toString()) : undefined
  }));
}

import { resolveReportingPeriod, buildWhereClauseForIntervals, ReportFilter } from '../../lib/reporting-period';

export const analyticsService = {
  async getDashboardStats(tenantId: string, filter: string, branchId?: string, userId?: string, createdById?: string) {
    let currentFilter: ReportFilter;
    let prevFilter: ReportFilter | null = null;
    
    if (filter === 'current-shift' || filter === 'previous-shift') {
      currentFilter = { type: filter, tenantId, branchId, userId: userId || '' };
      prevFilter = filter === 'current-shift' ? { type: 'previous-shift', tenantId, branchId, userId: userId || '' } : null;
    } else if (filter === 'shift') {
      currentFilter = { type: 'shift', shiftId: '', tenantId, branchId }; 
    } else {
      currentFilter = { type: 'calendar', preset: filter as any, tenantId, branchId };
    }

    const currentResult = await resolveReportingPeriod(currentFilter);
    const currentWhereDate = buildWhereClauseForIntervals(currentResult.intervals);

    let prevWhereDate: any = { createdAt: { gte: new Date('9999-12-31') } }; 
    if (prevFilter) {
       const prevResult = await resolveReportingPeriod(prevFilter);
       prevWhereDate = buildWhereClauseForIntervals(prevResult.intervals);
    } else if (currentResult.intervals.length === 1 && !currentResult.isShiftBased) {
       const start = currentResult.intervals[0].start;
       const end = currentResult.intervals[0].end;
       const duration = end.getTime() - start.getTime() + 1; 
       prevWhereDate = {
         createdAt: {
           gte: new Date(start.getTime() - duration),
           lt: start
         }
       };
    }

    const baseWhere: any = { tenantId };
    if (branchId && branchId !== 'all') {
      baseWhere.branchId = branchId;
    }
    if (createdById) {
      baseWhere.createdById = createdById;
    }

    const currentWhere = { ...baseWhere, ...currentWhereDate, status: { not: 'CANCELLED' } };
    const prevWhere = { ...baseWhere, ...prevWhereDate, status: { not: 'CANCELLED' } };
    const activeWhere = { ...baseWhere, status: { notIn: ['CANCELLED', 'DELIVERED', 'COMPLETED'] } };

    // Run parallel aggregates
    const [
      currentAgg,
      prevAgg,
      currentOrdersForGraphs,
      prevOrdersForGraphs, // Need this to calculate previous period revenue graph if needed, but not heavily used. Let's optimize.
      topItemsAgg,
      activeAgg,
      paymentMethodAgg,
      channelAgg
    ] = await Promise.all([
      prisma.order.aggregate({
        where: currentWhere,
        _sum: { grandTotal: true },
        _count: true,
        _avg: { grandTotal: true }
      }),
      prisma.order.aggregate({
        where: prevWhere,
        _sum: { grandTotal: true },
        _count: true,
        _avg: { grandTotal: true }
      }),
      // For graphs, we need order level data for the period. Since we want it to be fast, we select minimum fields.
      prisma.order.findMany({
        where: currentWhere,
        select: { grandTotal: true, createdAt: true, status: true }
      }),
      prisma.order.findMany({
        where: prevWhere,
        select: { grandTotal: true, createdAt: true, status: true }
      }),
      prisma.orderItem.groupBy({
        by: ['itemName'],
        where: { order: { ...currentWhere, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.order.aggregate({
        where: activeWhere,
        _count: true
      }),
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: currentWhere,
        _count: { paymentMethod: true }
      }),
      prisma.order.groupBy({
        by: ['channel'],
        where: currentWhere,
        _count: { channel: true }
      })
    ]);

    const currentRevenue = Number(currentAgg._sum.grandTotal) || 0;
    const prevRevenue = Number(prevAgg._sum.grandTotal) || 0;
    const currentOrdersCount = currentAgg._count || 0;
    const prevOrdersCount = prevAgg._count || 0;
    const currentAOV = Number(currentAgg._avg.grandTotal) || 0;
    const prevAOV = Number(prevAgg._avg.grandTotal) || 0;

    const revGrowth = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;
    const ordGrowth = prevOrdersCount > 0 ? Math.round(((currentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100) : 0;
    const aovGrowth = prevAOV > 0 ? Math.round(((currentAOV - prevAOV) / prevAOV) * 100) : 0;

    const revenueOverview = getAnalyticsPointsFromOrders(currentOrdersForGraphs, filter, 'revenue');
    const prevRevenueOverview = getAnalyticsPointsFromOrders(prevOrdersForGraphs, filter, 'revenue');
    const ordersVolume = getAnalyticsPointsFromOrders(currentOrdersForGraphs, filter, 'orders');
    const prevOrdersVolume = getAnalyticsPointsFromOrders(prevOrdersForGraphs, filter, 'orders');

    const topProducts = topItemsAgg.map(item => ({
      name: item.itemName,
      qty: item._sum.quantity || 0,
      revenue: Number(item._sum.totalPrice) || 0
    }));

    // Calculate Branch Performance
    const branches = await prisma.branch.findMany({
      where: {
        tenantId,
        ...(branchId && branchId !== 'all' ? { id: branchId } : {})
      }
    });

    const branchPerformance = await Promise.all(branches.map(async (branch) => {
      const bWhere = { ...currentWhere, branchId: branch.id };
      const pbWhere = { ...prevWhere, branchId: branch.id };
      
      const [bCurrAgg, bPrevAgg] = await Promise.all([
        prisma.order.aggregate({
          where: bWhere,
          _sum: { grandTotal: true },
          _count: true
        }),
        prisma.order.aggregate({
          where: pbWhere,
          _sum: { grandTotal: true },
          _count: true
        })
      ]);

      const curRev = Number(bCurrAgg._sum.grandTotal) || 0;
      const prevRev = Number(bPrevAgg._sum.grandTotal) || 0;
      const growth = prevRev > 0 ? Math.round(((curRev - prevRev) / prevRev) * 100) : 0;

      return {
        id: branch.id,
        name: branch.name || 'Branch',
        revenue: curRev,
        orders: bCurrAgg._count || 0,
        growth
      };
    }));

    const paymentMethodBreakdown = paymentMethodAgg.map(agg => ({
      name: agg.paymentMethod ? agg.paymentMethod.replace(/_/g, ' ') : 'Unknown',
      value: agg._count.paymentMethod
    }));

    const channelBreakdown = channelAgg.map(agg => ({
      name: agg.channel || 'Unknown',
      value: agg._count.channel
    }));

    return {
      revenue: currentRevenue,
      revGrowth,
      ordersCount: currentOrdersCount,
      ordGrowth,
      averageOrderValue: Math.round(currentAOV),
      aovGrowth,
      pendingOrders: activeAgg._count,
      revenueOverview,
      secondaryRevenueOverview: prevRevenueOverview,
      ordersVolume,
      secondaryOrdersVolume: prevOrdersVolume,
      topProducts,
      branchPerformance,
      paymentMethodBreakdown,
      channelBreakdown
    };
  }
};
