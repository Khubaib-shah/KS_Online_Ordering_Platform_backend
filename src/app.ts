// ─── Express Application ────────────────────────────────────────────

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler.middleware";

// Module routes
import tenantRoutes from "./modules/tenant/tenant.routes";
import authRoutes from "./modules/auth/auth.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/order/order.routes";
import customerRoutes from "./modules/customer/customer.routes";
import branchRoutes from "./modules/branch/branch.routes";
import staffRoutes from "./modules/staff/staff.routes";
import promotionRoutes from "./modules/promotion/promotion.routes";
import reportRoutes from "./modules/report/report.routes";
import superadminRoutes from "./modules/superadmin/superadmin.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import printerRoutes from "./modules/printer/printer.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import { tableRouter } from "./modules/table/table.route";
import { locationRoutes } from "./modules/location/location.routes";
import roleRoutes from "./modules/role/role.routes";
import shiftRoutes from "./modules/shift/shift.routes";
import auditLogRoutes from "./modules/audit-log/audit-log.routes";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
app.set("trust proxy", 1);

// ── Global Middleware ──
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Disable browser caching for all API responses
app.use((_req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// ── Health Check ──
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Route Registration ──
// Following the Unified API Endpoint Catalog (§7)

// Public: Tenant Resolution
app.use("/api/v1/tenant", tenantRoutes);

// Auth
app.use("/api/v1/auth", authRoutes);

// Public Website + Admin Menu (menu routes handle /website/catalog internally)
app.use("/api/v1", menuRoutes);

// Orders: /website/orders (public), /pos/orders (staff), /orders (admin)
app.use("/api/v1", orderRoutes);

// Promotions: /website/promos/validate (public) + /promotions (admin CRUD)
app.use("/api/v1", promotionRoutes);

// Branches: /branches (admin) + /website/delivery-zones (public)
app.use("/api/v1", branchRoutes);

// Locations: /location/cities (public)
app.use("/api/v1/location", locationRoutes);

// Admin-only modules
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/team", staffRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/superadmin", superadminRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/printer", printerRoutes);
app.use("/api/v1/tables", tableRouter);
app.use("/api/v1/audit-logs", auditLogRoutes);

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Endpoint not found" },
  });
});

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

export default app;
