# TASKS.md — Production Readiness Refactor (Restaurant-Backend)

## Phase 1: Security
- [x] SEC-1: Install `express-rate-limit` and create rate-limit middleware
- [x] SEC-1: Apply rate limits to `POST /auth/login` (10/15min), `POST /storefront/orders` (20/min), `POST /team/invite` (5/hr)
- [x] SEC-2: Set JWT as httpOnly cookie in `auth.controller.ts` login response
- [x] SEC-2: Read JWT from cookie in `auth.middleware.ts` (cookie primary, Authorization fallback)
- [x] SEC-4: Add production guard for CORS_ORIGIN in `env.ts`
- [x] SEC-6: Extract `promotion.routes.ts` → `promotion.controller.ts` + `promotion.service.ts` + `promotion.repository.ts`
- [x] SEC-6: Extract `branch.routes.ts` → `branch.controller.ts` + `branch.service.ts` + `branch.repository.ts`
- [x] SEC-6: Extract `staff.routes.ts` → `staff.controller.ts` + `staff.service.ts` + `staff.repository.ts`
- [x] SEC-6: Extract `report.routes.ts` → `report.controller.ts` + `report.service.ts`
- [x] SEC-6: Extract `superadmin.routes.ts` → `superadmin.controller.ts` + `superadmin.service.ts`
- [x] SEC-7: Move `order.service.ts` $transaction blocks into `order.repository.ts`
- [x] SEC-8: Move `tenant.service.ts` $transaction into `tenant.repository.ts`

## Phase 2: Error Handling & Validation
- [ ] ERR-1: Standardize Zod validation schemas for all incoming requests
- [ ] ERR-2: Implement a unified API Response formatter
- [ ] ERR-3: Ensure global error handler catches all asynchronous errors

## Phase 3: Performance & Optimization
- [ ] PERF-1: Add database indexes to Prisma schema for frequently queried fields
- [ ] PERF-2: Implement basic memory or Redis caching for read-heavy public endpoints
- [ ] PERF-3: Implement pagination for all list endpoints

## Phase 4: DRY Extraction
- [ ] DRY-1: Extract shared Prisma query logic into reusable helpers
- [ ] DRY-2: Consolidate duplicate permission/role-checking logic
- [ ] DRY-3: Extract `recalculateLineItems()` helper in `order.service.ts`

## Phase 5: Real-time & WebSockets (POS & Printer)
- [ ] WS-1: Standardize Socket.IO event namespaces for Dashboard, Kitchen, and Hardware
- [ ] WS-2: Implement socket authentication and tenant-based room isolation
- [ ] WS-3: Add heartbeat/health-check mechanisms for connected devices

## Phase 6: Observability & Logging
- [ ] LOG-1: Integrate Winston or Pino for structured JSON logging
- [ ] LOG-2: Add Request ID tracking middleware
- [ ] LOG-3: Log all unhandled promise rejections and fatal exceptions cleanly

## Phase 7: Security (Part 2)
- [ ] SEC-9: Integrate `helmet` to set secure HTTP response headers
- [ ] SEC-10: Review and sanitize all database inputs against injection patterns
- [ ] SEC-11: Ensure sensitive data is stripped from all API responses

## Phase 8: Testing Setup
- [ ] TEST-1: Configure Jest & `ts-jest` for the backend
- [ ] TEST-2: Write basic unit tests for core utilities and calculations

## Phase 9: Final Regression Sweep
- [ ] Verify TypeScript compilation succeeds
- [ ] Confirm all API endpoints respond correctly
- [ ] Test login → auth flow end-to-end
