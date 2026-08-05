import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../lib/errors';

export const tableService = {
  async createTable(tenantId: string, data: { branchId: string; tableNumber: string; capacity?: number; isActive?: boolean }) {
    const existing = await prisma.table.findUnique({
      where: { branchId_tableNumber: { branchId: data.branchId, tableNumber: data.tableNumber } },
    });
    if (existing) {
      throw new ValidationError('Table number already exists in this branch.');
    }

    return prisma.table.create({
      data: {
        tenantId,
        branchId: data.branchId,
        tableNumber: data.tableNumber,
        capacity: data.capacity ?? 2,
        isActive: data.isActive ?? true,
      },
    });
  },

  async getTablesByBranch(tenantId: string, branchId: string) {
    return prisma.table.findMany({
      where: { tenantId, branchId },
      orderBy: { tableNumber: 'asc' },
    });
  },

  async updateTable(tenantId: string, tableId: string, data: { tableNumber?: string; capacity?: number; isActive?: boolean }) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.tenantId !== tenantId) {
      throw new NotFoundError('Table');
    }

    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existing = await prisma.table.findUnique({
        where: { branchId_tableNumber: { branchId: table.branchId, tableNumber: data.tableNumber } },
      });
      if (existing) {
        throw new ValidationError('Table number already exists in this branch.');
      }
    }

    return prisma.table.update({
      where: { id: tableId },
      data,
    });
  },

  async deleteTable(tenantId: string, tableId: string) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.tenantId !== tenantId) {
      throw new NotFoundError('Table');
    }

    await prisma.table.delete({ where: { id: tableId } });
    return { success: true };
  },
};
