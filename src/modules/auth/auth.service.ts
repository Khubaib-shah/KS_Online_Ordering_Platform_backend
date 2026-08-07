// ─── Auth Service ───────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError } from '../../lib/errors';
import { JwtPayload } from '../../middlewares/auth.middleware';

export const authService = {
  async login(email: string, password: string, tenantSlug?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        globalRole: true,
        isActive: true,
        tenantId: true,
        avatarUrl: true,
        tenant: { select: { slug: true, name: true, status: true } },
        staffProfile: {
          select: {
            designation: true,
            branchId: true,
            permissionOrders: true,
            permissionMenu: true,
            permissionReports: true,
            permissionSettings: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Account is disabled');

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw new UnauthorizedError('Invalid email or password');

    // Tenant context validation for non-super-admins
    if (user.globalRole !== 'SUPER_ADMIN') {
      if (user.tenant?.status === 'SUSPENDED') {
        throw new UnauthorizedError('Your tenant account has been suspended');
      }
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      globalRole: user.globalRole,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    let activeShift = null;
    if (user.tenantId && user.globalRole !== 'SUPER_ADMIN') {
      // Close any existing open shifts
      await prisma.cashierShift.updateMany({
        where: {
          userId: user.id,
          status: 'OPEN',
        },
        data: {
          status: 'CLOSED',
          endTime: new Date(),
        },
      });

      // Open a new shift
      activeShift = await prisma.cashierShift.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          branchId: user.staffProfile?.branchId,
          status: 'OPEN',
          startTime: new Date(),
        },
      });
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        tenant: user.tenant ? { slug: user.tenant.slug, name: user.tenant.name } : null,
        staffProfile: user.staffProfile,
        activeShift: activeShift,
      },
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        globalRole: true,
        avatarUrl: true,
        tenantId: true,
        tenant: { select: { id: true, slug: true, name: true, businessType: true, status: true } },
        staffProfile: {
          select: {
            designation: true,
            branchId: true,
            permissionOrders: true,
            permissionMenu: true,
            permissionReports: true,
            permissionSettings: true,
            branch: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User', userId);

    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      orderBy: { startTime: 'desc' },
    });

    return { ...user, activeShift };
  },

  async logout(userId: string) {
    await prisma.cashierShift.updateMany({
      where: {
        userId,
        status: 'OPEN',
      },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
      },
    });
  },
};
