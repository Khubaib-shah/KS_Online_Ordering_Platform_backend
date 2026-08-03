// ─── Super Admin Service ─────────────────────────────────────────────
import { prisma } from '../../config/database';
import { tenantService } from '../tenant/tenant.service';

export const superadminService = {
  async listTenants(page: number, limit: number) {
    return tenantService.listAll(page, limit);
  },

  async createTenant(data: any) {
    return tenantService.createWithOwner(data);
  },

  async updateTenantStatus(id: string, status: any) {
    return tenantService.updateStatus(id, status);
  },

  async deleteTenant(id: string) {
    return tenantService.delete(id);
  },

  async updateTenant(id: string, data: any) {
    return tenantService.updateTenantAndOwner(id, data);
  },

  async getTenantDetail(id: string) {
    return tenantService.getById(id);
  },

  async listSupportEscalations(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        select: {
          id: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          tenant: { select: { name: true, slug: true } },
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count(),
    ]);
    return { tickets, total };
  },

  async listPlans() {
    return prisma.platformPlan.findMany({
      select: {
        id: true,
        name: true,
        monthlyPrice: true,
        maxBranches: true,
        maxMenuItems: true,
        transactionFeePct: true,
        featuresJson: true,
        _count: { select: { tenants: true } },
      },
    });
  },

  async getPlatformStats() {
    const [totalTenants, activeTenants, totalOrders, totalRevenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { grandTotal: true } }),
    ]);

    // Calculate Weekly SaaS API load (simulated via order volume over the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const volumeMap = new Map<number, number>();
    recentOrders.forEach(order => {
      const dayIndex = order.createdAt.getDay();
      volumeMap.set(dayIndex, (volumeMap.get(dayIndex) || 0) + 1);
    });

    // Find max value to calculate percentages
    let maxOrders = 0;
    volumeMap.forEach(count => {
      if (count > maxOrders) maxOrders = count;
    });

    // If maxOrders is 0, avoid division by zero
    if (maxOrders === 0) maxOrders = 1;

    // Create array ordered from 6 days ago to today
    const saasVolumeData: any[] = [];
    const today = new Date().getDay();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetDay = targetDate.getDay();

      const count = volumeMap.get(targetDay) || 0;
      const percentage = Math.round((count / maxOrders) * 100);

      // Assign visual styles based on volume
      let fillStyle = 'striped';
      if (percentage > 80) fillStyle = 'solid-dark';
      else if (percentage > 50) fillStyle = 'solid-light';

      saasVolumeData.push({
        day: days[targetDay],
        value: percentage, // Ensure it's a value between 0 and 100
        fillStyle
      });
    }

    return {
      totalTenants,
      activeTenants,
      totalOrders,
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      saasVolumeData,
    };
  },

  async listGlobalAreas() {
    return await prisma.globalArea.findMany({
      orderBy: [
        { city: 'asc' },
        { region: 'asc' },
        { name: 'asc' }
      ]
    });
  },

  async createGlobalArea(data: any) {
    return await prisma.globalArea.create({
      data
    });
  },

  async updateGlobalArea(id: string, data: any) {
    return await prisma.globalArea.update({
      where: { id },
      data
    });
  },

  async deleteGlobalArea(id: string) {
    return await prisma.globalArea.delete({
      where: { id }
    });
  },
};
