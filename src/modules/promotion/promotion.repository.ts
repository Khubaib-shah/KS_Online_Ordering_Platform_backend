// ─── Promotion Repository ───────────────────────────────────────────
import { prisma } from '../../config/database';

export const promotionRepository = {
  async findByCode(tenantId: string, code: string) {
    return prisma.promotion.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase(),
        isActive: true,
      },
    });
  },

  async incrementUsage(id: string) {
    return prisma.promotion.update({
      where: { id },
      data: { timesUsed: { increment: 1 } },
    });
  },

  async list(tenantId: string, skip: number, take: number) {
    const [promos, total] = await Promise.all([
      prisma.promotion.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.promotion.count({ where: { tenantId } }),
    ]);
    return { promos, total };
  },

  async create(tenantId: string, data: any) {
    return prisma.promotion.create({
      data: {
        tenantId,
        ...data,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.promotion.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.promotion.delete({
      where: { id },
    });
  },
};
