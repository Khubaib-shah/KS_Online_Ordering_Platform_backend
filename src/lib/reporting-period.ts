import { prisma } from '../config/database';
import { toDate, formatInTimeZone } from 'date-fns-tz';

export type ReportFilter =
  | { type: 'calendar'; preset: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'year'; tenantId: string; branchId?: string }
  | { type: 'custom'; start: Date; end: Date; tenantId: string; branchId?: string }
  | { type: 'current-shift'; userId: string; tenantId: string; branchId?: string }
  | { type: 'previous-shift'; userId: string; tenantId: string; branchId?: string }
  | { type: 'shift'; shiftId: string; tenantId: string; branchId?: string };

export interface ReportingPeriodResult {
  intervals: { start: Date; end: Date }[];
  isShiftBased: boolean;
}

export async function resolveReportingPeriod(filter: ReportFilter): Promise<ReportingPeriodResult> {
  const now = new Date();

  // If it's a shift-based filter
  if (filter.type === 'current-shift' || filter.type === 'previous-shift' || filter.type === 'shift') {
    if (filter.type === 'current-shift') {
      // Check if this is for a specific cashier or a branch manager
      if (filter.userId) {
        // Is there an active shift for this user?
        const activeShift = await prisma.cashierShift.findFirst({
          where: { userId: filter.userId, status: 'OPEN', tenantId: filter.tenantId },
          orderBy: { createdAt: 'desc' }
        });
        if (activeShift) {
          return { intervals: [{ start: activeShift.startTime, end: now }], isShiftBased: true };
        }
        
        // If the user has permission to see the branch, we show all active branch shifts
        const user = await prisma.user.findUnique({
          where: { id: filter.userId },
          include: { staffProfile: { include: { role: true } } }
        });
        
        let isManager = false;
        if (user?.globalRole === 'SUPER_ADMIN' || user?.staffProfile?.isOwner) {
          isManager = true;
        } else if (user?.staffProfile?.role?.permissions) {
          const perms = user.staffProfile.role.permissions as any;
          if (perms.reports === 'all' || perms.reports === 'branch_only') {
            isManager = true;
          }
        }
        
        if (isManager && filter.branchId) {
          const activeBranchShifts = await prisma.cashierShift.findMany({
            where: { branchId: filter.branchId, status: 'OPEN', tenantId: filter.tenantId }
          });
          if (activeBranchShifts.length > 0) {
            return {
              intervals: activeBranchShifts.map(s => ({ start: s.startTime, end: now })),
              isShiftBased: true
            };
          }
        }
      }
      return { intervals: [], isShiftBased: true }; // No active shifts
    }

    if (filter.type === 'previous-shift') {
      const lastClosedShift = await prisma.cashierShift.findFirst({
        where: { userId: filter.userId, status: 'CLOSED', tenantId: filter.tenantId },
        orderBy: { endTime: 'desc' }
      });
      if (lastClosedShift && lastClosedShift.endTime) {
        return { intervals: [{ start: lastClosedShift.startTime, end: lastClosedShift.endTime }], isShiftBased: true };
      }
      return { intervals: [], isShiftBased: true };
    }

    if (filter.type === 'shift') {
      const shift = await prisma.cashierShift.findUnique({
        where: { id: filter.shiftId }
      });
      if (shift && shift.tenantId === filter.tenantId) {
        return { intervals: [{ start: shift.startTime, end: shift.endTime || now }], isShiftBased: true };
      }
      return { intervals: [], isShiftBased: true };
    }
  }

  if (filter.type === 'custom') {
    return { intervals: [{ start: filter.start, end: filter.end }], isShiftBased: false };
  }

  // --- Calendar based filters ---
  // Resolve timezone from branch or default to UTC
  let tz = 'UTC';
  if (filter.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: filter.branchId }, select: { timezone: true } });
    if (branch && branch.timezone) tz = branch.timezone;
  } else {
    const firstBranch = await prisma.branch.findFirst({ where: { tenantId: filter.tenantId }, select: { timezone: true } });
    if (firstBranch && firstBranch.timezone) tz = firstBranch.timezone;
  }

  const tzDateStr = formatInTimeZone(now, tz, 'yyyy-MM-dd'); // e.g. "2026-08-08"
  
  const getStartOfDay = (dateStr: string) => toDate(`${dateStr}T00:00:00`, { timeZone: tz });
  const getStartOfNextDay = (dateStr: string) => {
    const d = toDate(`${dateStr}T00:00:00`, { timeZone: tz });
    d.setDate(d.getDate() + 1);
    return d;
  };

  const todayStart = getStartOfDay(tzDateStr);
  const todayEnd = getStartOfNextDay(tzDateStr);

  if (filter.preset === 'today') {
    return { intervals: [{ start: todayStart, end: todayEnd }], isShiftBased: false };
  }
  if (filter.preset === 'yesterday') {
    const yestStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
    return { intervals: [{ start: getStartOfDay(yestStr), end: getStartOfNextDay(yestStr) }], isShiftBased: false };
  }
  if (filter.preset === '7d') {
    const start7dStr = formatInTimeZone(new Date(now.getTime() - 6 * 86400000), tz, 'yyyy-MM-dd');
    return { intervals: [{ start: getStartOfDay(start7dStr), end: todayEnd }], isShiftBased: false };
  }
  if (filter.preset === '30d') {
    const start30dStr = formatInTimeZone(new Date(now.getTime() - 29 * 86400000), tz, 'yyyy-MM-dd');
    return { intervals: [{ start: getStartOfDay(start30dStr), end: todayEnd }], isShiftBased: false };
  }
  if (filter.preset === 'month') {
    const monthStartStr = formatInTimeZone(now, tz, 'yyyy-MM-01');
    return { intervals: [{ start: getStartOfDay(monthStartStr), end: todayEnd }], isShiftBased: false };
  }
  if (filter.preset === 'year') {
    const yearStartStr = formatInTimeZone(now, tz, 'yyyy-01-01');
    return { intervals: [{ start: getStartOfDay(yearStartStr), end: todayEnd }], isShiftBased: false };
  }

  return { intervals: [{ start: todayStart, end: todayEnd }], isShiftBased: false };
}

export function buildWhereClauseForIntervals(intervals: { start: Date; end: Date }[]) {
  if (intervals.length === 0) {
    // No matching active shifts, return an impossible condition to return 0 orders
    return { createdAt: { gte: new Date('9999-12-31') } };
  }
  
  if (intervals.length === 1) {
    return {
      createdAt: {
        gte: intervals[0].start,
        lt: intervals[0].end
      }
    };
  }

  return {
    OR: intervals.map(interval => ({
      createdAt: {
        gte: interval.start,
        lt: interval.end
      }
    }))
  };
}
