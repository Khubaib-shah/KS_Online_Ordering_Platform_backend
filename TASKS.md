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

## Phase 4: DRY Extraction
- [ ] DRY-3: Extract `recalculateLineItems()` helper in `order.service.ts`

## Phase 9: Final Regression Sweep
- [ ] Verify TypeScript compilation succeeds
- [ ] Confirm all API endpoints respond correctly
- [ ] Test login → auth flow end-to-end
