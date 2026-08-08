import { prisma } from '../../config/database';
import { ValidationError } from '../../lib/errors';
import { z } from 'zod';
import { createRoleSchema, updateRoleSchema } from './role.validation';

export const roleService = {
  async createRole(tenantId: string, data: z.infer<typeof createRoleSchema>) {
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

    return prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
      },
    });
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

  async updateRole(id: string, tenantId: string, data: z.infer<typeof updateRoleSchema>) {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
    });
    if (!role) throw new Error('Role not found');
    return prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
    });
  },

  async deleteRole(id: string, tenantId: string) {
    return prisma.role.deleteMany({
      where: { id, tenantId },
    });
  },
};
