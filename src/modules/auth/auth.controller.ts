// ─── Auth Controller ────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../lib/api-response';
import { env } from '../../config/env';
import { PLATFORM_NAME } from '../../config/constants';

// Cookie configuration for JWT storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT_EXPIRES_IN default)
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, tenantSlug } = req.body;
      const result = await authService.login(email, password, tenantSlug);

      // Set JWT as httpOnly cookie — not accessible from JavaScript
      res.cookie(`${PLATFORM_NAME.toLowerCase()}_token`, result.token, COOKIE_OPTIONS);

      // Return user data (without token in body for new clients, but keep for backward compat)
      sendSuccess(res, { token: result.token, user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logout(req.user.userId);
      }
      // Clear the auth cookie
      res.clearCookie(`${PLATFORM_NAME.toLowerCase()}_token`, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
        path: '/',
      });
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },
};
