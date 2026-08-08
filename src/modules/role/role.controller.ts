import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';
import { createRoleSchema, updateRoleSchema } from './role.validation';

export const roleController = {
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, error: { message: 'Tenant required' } });
      }

      const validatedData = createRoleSchema.parse(req.body);
      const role = await roleService.createRole(tenantId, validatedData);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, error: { message: 'Tenant required' } });
      }

      const roles = await roleService.getRoles(tenantId);
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, error: { message: 'Tenant required' } });
      }

      const roleId = req.params.id as string;
      const role = await roleService.getRoleById(roleId, tenantId);
      if (!role) {
        return res.status(404).json({ success: false, error: { message: 'Role not found' } });
      }
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, error: { message: 'Tenant required' } });
      }

      const roleId = req.params.id as string;
      const validatedData = updateRoleSchema.parse(req.body);
      const role = await roleService.updateRole(roleId, tenantId, validatedData);
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, error: { message: 'Tenant required' } });
      }

      const roleId = req.params.id as string;
      await roleService.deleteRole(roleId, tenantId);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
