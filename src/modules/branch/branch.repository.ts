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
        _count: { select: { orders: true, staffProfiles: true, deliveryZones: true } },
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

  async update(id: string, data: any) {
    return prisma.branch.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.branch.delete({
      where: { id },
    });
  },

  async findZonesByBranch(branchId: string) {
    return prisma.deliveryZone.findMany({
      where: { branchId },
      orderBy: { areaName: 'asc' },
    });
  },

  async createZone(branchId: string, data: any) {
    return prisma.deliveryZone.create({
      data: {
        branchId,
        ...data,
      },
    });
  },

  async updateZone(id: string, data: any) {
    return prisma.deliveryZone.update({
      where: { id },
      data,
    });
  },

  async deleteZone(id: string) {
    return prisma.deliveryZone.delete({
      where: { id },
    });
  },

  async listStorefrontZones(tenantId: string) {
    return prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        deliveryZones: {
          where: { isActive: true },
          select: { id: true, areaName: true, city: true, deliveryFee: true, estimatedMinutes: true },
          orderBy: { areaName: 'asc' },
        },
      },
    });
  },
};
