// ─── Express Application ────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler.middleware';

// Module routes
import tenantRoutes from './modules/tenant/tenant.routes';
import authRoutes from './modules/auth/auth.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/order/order.routes';
import customerRoutes from './modules/customer/customer.routes';
import branchRoutes from './modules/branch/branch.routes';
import staffRoutes from './modules/staff/staff.routes';
import promotionRoutes from './modules/promotion/promotion.routes';
import reportRoutes from './modules/report/report.routes';
import superadminRoutes from './modules/superadmin/superadmin.routes';
import uploadRoutes from './modules/upload/upload.routes';
import printerRoutes from './modules/printer/printer.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import { tableRouter } from './modules/table/table.route';
import { locationRoutes } from './modules/location/location.routes';
import roleRoutes from './modules/role/role.routes';

const app = express();

// ── Global Middleware ──
app.use(cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Route Registration ──
// Following the Unified API Endpoint Catalog (§7)

// Public: Tenant Resolution
app.use('/api/v1/tenant', tenantRoutes);

// Auth
app.use('/api/v1/auth', authRoutes);

// Public Website + Admin Menu (menu routes handle /website/catalog internally)
app.use('/api/v1', menuRoutes);

// Orders: /website/orders (public), /pos/orders (staff), /orders (admin)
app.use('/api/v1', orderRoutes);

// Promotions: /website/promos/validate (public) + /promotions (admin CRUD)
app.use('/api/v1', promotionRoutes);

// Branches: /branches (admin) + /website/delivery-zones (public)
app.use('/api/v1', branchRoutes);

// Locations: /location/cities (public)
app.use('/api/v1/location', locationRoutes);

// Admin-only modules
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/team', staffRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/printer', printerRoutes);
app.use('/api/v1/tables', tableRouter);

// Test Route for triggering a print job to the POS device!
app.get('/api/v1/test-print', async (req, res) => {
  try {
    const { getIO } = await import('./modules/printer/printer.socket');
    const io = getIO();

    // In production, we'd look up the socketId from the DB using the deviceId
    // For this test, we broadcast to the room or just globally if only 1 device is connected
    io.emit('print:job', {
      id: 'job-12345',
      type: 'receipt',
      payload: {
        orderId: '101010',
        total: 550,
        items: [{ name: 'Test Burger', qty: 1 }]
      }
    });

    res.json({ success: true, message: 'Print job dispatched to socket.io!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

export default app;
