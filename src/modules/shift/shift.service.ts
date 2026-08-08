import { prisma } from '../../config/database';

export const shiftService = {
  async getMyActiveShift(tenantId: string, userId: string) {
    return prisma.cashierShift.findFirst({
      where: { tenantId, userId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getMyPreviousShift(tenantId: string, userId: string) {
    return prisma.cashierShift.findFirst({
      where: { tenantId, userId, status: 'CLOSED' },
      orderBy: { endTime: 'desc' }
    });
  },

  async getBranchShifts(tenantId: string, branchId: string) {
    return prisma.cashierShift.findMany({
      where: { tenantId, branchId, status: 'OPEN' },
      orderBy: { startTime: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  },

  async getBranchShiftHistory(tenantId: string, branchId: string, limit: number = 10) {
    return prisma.cashierShift.findMany({
      where: { tenantId, branchId, status: 'CLOSED' },
      orderBy: { endTime: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }
};
