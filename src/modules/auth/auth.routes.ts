// ─── Auth Routes ────────────────────────────────────────────────────

import { Router } from "express";
import { authController, requireCsrf } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authRequired } from "../../middlewares/auth.middleware";
import { loginSchema } from "./auth.validation";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
router.post("/logout", authRequired, requireCsrf, authController.logout);
router.get("/me", authRequired, authController.getMe);

export default router;
