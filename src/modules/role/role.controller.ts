// ─── Role Controller ────────────────────────────────────────────────
// Tenant scoping is handled by tenantResolver middleware (req.tenantId).
// Actor context is passed to service for escalation guards.

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { roleService } from './role.service';
import { createRoleSchema, updateRoleSchema } from './role.validation';
import { sendSuccess, sendError } from '../../lib/api-response';

export const roleController = {
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createRoleSchema.parse(req.body);
      const role = await roleService.createRole(
        req.tenantId!,
        validatedData,
        req.user?.userId,
        req.staffProfile,
      );
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.getRoles(req.tenantId!);
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.getRoleById(req.params.id, req.tenantId!);
      if (!role) {
        return sendError(res, 404, 'NOT_FOUND', 'Role not found');
      }
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateRoleSchema.parse(req.body);
      const role = await roleService.updateRole(
        req.params.id,
        req.tenantId!,
        validatedData,
        req.user?.userId,
        req.staffProfile,
      );
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.deleteRole(req.params.id, req.tenantId!, req.user?.userId);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
