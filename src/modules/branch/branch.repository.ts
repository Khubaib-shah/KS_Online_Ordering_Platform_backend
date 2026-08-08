// ─── Branch Repository ──────────────────────────────────────────────
import { prisma } from '../../config/database';

export const branchRepository = {
  async list(tenantId: string) {
    return prisma.branch.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        isActive: true,
        openingTime: true,
        closingTime: true,
        _count: { select: { orders: true, staffProfiles: true, branchCoverages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(tenantId: string, data: any) {
    return prisma.branch.create({
      data: {
        tenantId,
        ...data,
      },
    });
  },

  async update(id: string, tenantId: string, data: any) {
    const existing = await prisma.branch.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Branch not found');
    return prisma.branch.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.branch.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Branch not found');
    return prisma.branch.delete({
      where: { id },
    });
  },

  async findZonesByBranch(branchId: string) {
    return prisma.branchCoverage.findMany({
      where: { branchId },
      include: { area: { include: { zone: true } } },
    });
  },

  async createZone(branchId: string, data: any) {
    return prisma.branchCoverage.create({
      data: {
        branchId,
        ...data,
      },
    });
  },

  async updateZone(id: string, tenantId: string, data: any) {
    const existing = await prisma.branchCoverage.findFirst({ where: { id, branch: { tenantId } } });
    if (!existing) throw new Error('Zone not found');
    return prisma.branchCoverage.update({
      where: { id },
      data,
    });
  },

  async deleteZone(id: string, tenantId: string) {
    const existing = await prisma.branchCoverage.findFirst({ where: { id, branch: { tenantId } } });
    if (!existing) throw new Error('Zone not found');
    return prisma.branchCoverage.delete({
      where: { id },
    });
  },

  async listWebsiteZones(tenantId: string) {
    return prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        branchCoverages: {
          select: { id: true, areaId: true, deliveryFee: true, estimatedMinutes: true, area: { select: { name: true } } },
        },
      },
    });
  },
};
