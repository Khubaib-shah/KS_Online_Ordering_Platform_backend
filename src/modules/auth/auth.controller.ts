// ─── Auth Controller ────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { sendSuccess } from "../../lib/api-response";
import { env } from "../../config/env";
import { PLATFORM_NAME } from "../../config/constants";
import crypto from "crypto";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite:
    env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const CSRF_COOKIE_NAME = `${PLATFORM_NAME.toLowerCase()}_csrf`;

const getCsrfToken = () => crypto.randomBytes(32).toString("hex");

export const requireCsrf = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  if (req.path.endsWith("/login")) {
    return next();
  }

  const headerToken =
    (req.headers["x-csrf-token"] as string | undefined) ||
    (req.headers["x-xsrf-token"] as string | undefined);
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    res.status(403).json({
      success: false,
      error: {
        code: "CSRF_TOKEN_MISSING",
        message: "Missing or invalid CSRF token.",
      },
    });
    return;
  }

  next();
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, tenantSlug } = req.body;
      const result = await authService.login(email, password, tenantSlug);

      const csrfToken = getCsrfToken();
      res.cookie(
        `${PLATFORM_NAME.toLowerCase()}_token`,
        result.token,
        COOKIE_OPTIONS,
      );
      res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        ...COOKIE_OPTIONS,
        httpOnly: true,
      });

      sendSuccess(res, { token: result.token, user: result.user, csrfToken });
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
        secure: env.NODE_ENV === "production",
        sameSite:
          env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
        path: "/",
      });
      res.clearCookie(CSRF_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite:
          env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
        path: "/",
      });
      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
};
