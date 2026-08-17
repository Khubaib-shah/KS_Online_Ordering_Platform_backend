// ─── Staff Service ──────────────────────────────────────────────────
import bcrypt from "bcryptjs";
import { staffRepository } from "./staff.repository";
import { canMutateStaffRole } from "./staff.security";
import { auditLogService } from "../../lib/audit-log.service";

export const staffService = {
  async list(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return staffRepository.list(tenantId, skip, limit);
  },

  async invite(tenantId: string, data: any, actorUserId?: string) {
    const { email, name, password, branchId, roleId } = data;
    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      email,
      name,
      passwordHash,
      globalRole: "TENANT_USER",
    };

    const staffProfileData = {
      roleId: roleId || null,
      branchId,
    };

    const result = await staffRepository.create(tenantId, userData, staffProfileData);

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        branchId,
        actorId: actorUserId,
        action: 'STAFF_INVITED',
        targetType: 'User',
        targetId: result.id,
        metadata: { email, name, roleId, branchId },
      });
    }

    return result;
  },

  async updatePermissions(
    id: string,
    tenantId: string,
    data: any,
    actorUserId?: string,
  ) {
    const result = await staffRepository.updatePermissions(id, tenantId, data, actorUserId);

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        actorId: actorUserId,
        action: 'STAFF_UPDATED',
        targetType: 'StaffProfile',
        targetId: id,
        metadata: { changes: data },
      });
    }

    return result;
  },

  async deactivate(userId: string, tenantId: string, actorUserId?: string) {
    const result = await staffRepository.deactivate(userId, tenantId);

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        actorId: actorUserId,
        action: 'STAFF_DEACTIVATED',
        targetType: 'User',
        targetId: userId,
      });
    }

    return result;
  },

  async getById(id: string, tenantId: string) {
    return staffRepository.findById(id, tenantId);
  },
};

export { canMutateStaffRole };
