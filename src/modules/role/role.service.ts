// ─── Role Service ───────────────────────────────────────────────────
// Role CRUD with escalation guards and audit logging.

import { prisma } from '../../config/database';
import { ValidationError } from '../../lib/errors';
import { auditLogService } from '../../lib/audit-log.service';
import { z } from 'zod';
import { createRoleSchema, updateRoleSchema } from './role.validation';

/**
 * Validates that an actor's permissions are a superset of the role being created/updated.
 * Owners/SuperAdmins bypass this check.
 */
function validatePermissionEscalation(
  actorPerms: Record<string, any> | null,
  actorIsOwnerOrSuper: boolean,
  rolePerms: Record<string, any>,
  actorScope: string,
  roleScope: string,
) {
  if (actorIsOwnerOrSuper) return;

  const violations: string[] = [];

  // Scope escalation check
  if (roleScope === 'TENANT' && actorScope !== 'TENANT') {
    violations.push('Cannot create a TENANT-scoped role — your role is BRANCH-scoped.');
  }

  // Permission escalation check
  if (actorPerms) {
    for (const [module, actions] of Object.entries(rolePerms)) {
      const actorModuleKey = Object.keys(actorPerms).find(k => k.toLowerCase() === module.toLowerCase());
      const actorActions = actorModuleKey ? actorPerms[actorModuleKey] : [];

      if (Array.isArray(actions)) {
        const actorList = Array.isArray(actorActions)
          ? actorActions.map((a: string) => a.toLowerCase())
          : [];
        for (const action of actions) {
          if (!actorList.includes(action.toLowerCase())) {
            violations.push(`Cannot grant ${module}:${action} — you don't have this permission.`);
          }
        }
      }
    }
  } else {
    // Actor has no permissions at all — they cannot grant any
    if (Object.keys(rolePerms).length > 0) {
      violations.push('Cannot grant any permissions — you have no permissions assigned.');
    }
  }

  if (violations.length > 0) {
    throw new ValidationError(violations.join(' | '));
  }
}

export const roleService = {
  async createRole(
    tenantId: string,
    data: z.infer<typeof createRoleSchema>,
    actorUserId?: string,
    actorProfile?: any,
  ) {
    const existing = await prisma.role.findFirst({
      where: {
        tenantId,
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ValidationError('A role with this name already exists.');
    }

    // Escalation guard for non-Owner actors
    const isOwnerOrSuper = !actorProfile || actorProfile.isOwner;
    if (!isOwnerOrSuper && actorProfile) {
      validatePermissionEscalation(
        actorProfile.role?.permissions as Record<string, any> || null,
        false,
        (data.permissions || {}) as Record<string, any>,
        actorProfile.role?.scope || 'BRANCH',
        (data as any).scope || 'BRANCH',
      );
    }

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
        rank: (data as any).rank ?? 10,
        scope: (data as any).scope ?? 'BRANCH',
      },
    });

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        actorId: actorUserId,
        action: 'ROLE_CREATED',
        targetType: 'Role',
        targetId: role.id,
        metadata: { name: role.name, permissions: role.permissions, rank: role.rank, scope: role.scope },
      });
    }

    return role;
  },

  async getRoles(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { staffProfiles: true }
        }
      }
    });
  },

  async getRoleById(id: string, tenantId: string) {
    return prisma.role.findFirst({
      where: { id, tenantId },
    });
  },

  async updateRole(
    id: string,
    tenantId: string,
    data: z.infer<typeof updateRoleSchema>,
    actorUserId?: string,
    actorProfile?: any,
  ) {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
    });
    if (!role) throw new Error('Role not found');

    // Escalation guard for non-Owner actors
    const isOwnerOrSuper = !actorProfile || actorProfile.isOwner;
    if (!isOwnerOrSuper && actorProfile && data.permissions) {
      validatePermissionEscalation(
        actorProfile.role?.permissions as Record<string, any> || null,
        false,
        data.permissions as Record<string, any>,
        actorProfile.role?.scope || 'BRANCH',
        (data as any).scope || role.scope || 'BRANCH',
      );
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        rank: (data as any).rank,
        scope: (data as any).scope,
      },
    });

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        actorId: actorUserId,
        action: 'ROLE_UPDATED',
        targetType: 'Role',
        targetId: id,
        metadata: {
          name: updated.name,
          changes: data,
        },
      });
    }

    return updated;
  },

  async deleteRole(id: string, tenantId: string, actorUserId?: string) {
    const role = await prisma.role.findFirst({ where: { id, tenantId } });
    if (!role) throw new Error('Role not found');

    const result = await prisma.role.deleteMany({
      where: { id, tenantId },
    });

    // Audit log
    if (actorUserId) {
      await auditLogService.record({
        tenantId,
        actorId: actorUserId,
        action: 'ROLE_DELETED',
        targetType: 'Role',
        targetId: id,
        metadata: { name: role.name },
      });
    }

    return result;
  },
};
