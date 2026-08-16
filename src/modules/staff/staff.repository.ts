// ─── Staff Repository ───────────────────────────────────────────────
import { prisma } from "../../config/database";
import { canMutateStaffRole } from "./staff.security";

export const STAFF_SELECT = {
  id: true,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      isActive: true,
    },
  },
  isOwner: true,
  branchId: true,
  branch: { select: { id: true, name: true } },
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

  async updatePermissions(
    id: string,
    tenantId: string,
    data: any,
    actorUserId?: string,
  ) {
    const existing = await prisma.staffProfile.findFirst({
      where: { id, user: { tenantId } },
      include: {
        role: true,
        user: {
          select: { id: true, tenantId: true },
        },
      },
    });

    if (!existing) throw new Error("Staff profile not found");

    const nextRoleId = data.roleId ?? existing.roleId;
    const nextRole = nextRoleId
      ? await prisma.role.findFirst({ where: { id: nextRoleId, tenantId } })
      : null;

    if (actorUserId && actorUserId === existing.user.id) {
      throw new Error("You cannot change your own role assignment.");
    }

    if (actorUserId) {
      const actorProfile = await prisma.staffProfile.findFirst({
        where: { userId: actorUserId, user: { tenantId } },
        include: { role: true },
      });

      if (!actorProfile) {
        throw new Error("Actor staff profile is missing for this tenant.");
      }

      const nextRoleName = nextRole?.name ?? existing.role?.name ?? null;
      const actorRoleName = actorProfile.role?.name ?? null;

      if (
        !canMutateStaffRole(
          { isOwner: actorProfile.isOwner, role: { name: actorRoleName } },
          {
            isOwner: existing.isOwner,
            role: { name: existing.role?.name ?? null },
          },
          nextRoleName,
        )
      ) {
        throw new Error("Role hierarchy prevents this permission change.");
      }
    }

    return prisma.staffProfile.update({
      where: { id },
      data,
      select: STAFF_SELECT,
    });
  },

  async deactivate(userId: string, tenantId: string) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new Error("User not found");
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  },
};
