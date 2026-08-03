// ─── Auth Controller ────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../lib/api-response';
import { env } from '../../config/env';

// Cookie configuration for JWT storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT_EXPIRES_IN default)
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, tenantSlug } = req.body;
      const result = await authService.login(email, password, tenantSlug);

      // Set JWT as httpOnly cookie — not accessible from JavaScript
      res.cookie('indolj_token', result.token, COOKIE_OPTIONS);

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

  async logout(_req: Request, res: Response): Promise<void> {
    // Clear the auth cookie
    res.clearCookie('indolj_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    });
    sendSuccess(res, { message: 'Logged out successfully' });
  },
};
