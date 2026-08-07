// ─── Staff Repository ───────────────────────────────────────────────
import { prisma } from '../../config/database';

export const STAFF_SELECT = {
  id: true,
  user: {
    select: { id: true, email: true, name: true, avatarUrl: true, isActive: true },
  },
  designation: true,
  branchId: true,
  branch: { select: { id: true, name: true } },
  permissionOrders: true,
  permissionMenu: true,
  permissionReports: true,
  permissionSettings: true,
  roleId: true,
  role: { select: { id: true, name: true, permissions: true } },
};

export const staffRepository = {
  async list(tenantId: string, skip: number, take: number) {
    const [staff, total] = await Promise.all([
      prisma.staffProfile.findMany({
        where: { user: { tenantId } },
        select: STAFF_SELECT,
        skip,
        take,
      }),
      prisma.staffProfile.count({ where: { user: { tenantId } } }),
    ]);
    return { staff, total };
  },

  async create(tenantId: string, userData: any, staffProfileData: any) {
    return prisma.user.create({
      data: {
        tenantId,
        ...userData,
        staffProfile: {
          create: staffProfileData,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        staffProfile: { select: STAFF_SELECT },
      },
    });
  },

  async updatePermissions(id: string, data: any) {
    return prisma.staffProfile.update({
      where: { id },
      data,
      select: STAFF_SELECT,
    });
  },

  async deactivate(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  },
};
