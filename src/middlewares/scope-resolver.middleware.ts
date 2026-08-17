// ─── Scope Resolver Middleware ──────────────────────────────────────
// Determines the branch scope for the current request based on the
// actor's role. Must run after requirePermission (which attaches req.staffProfile).
//
// Scope logic:
//   Super Admin or Owner      → branchId: null (unrestricted)
//   TENANT-scoped role        → branchId: null (unrestricted within tenant)
//   BRANCH-scoped role        → branchId: actor's staffProfile.branchId
//   Misconfigured (no branch) → 403 fail-closed

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../lib/api-response';

export function resolveScope() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Super Admins always get unrestricted scope
    if (req.user?.globalRole === 'SUPER_ADMIN') {
      req.scope = { tenantId: req.tenantId!, branchId: null };
      return next();
    }

    // If requirePermission already attached staffProfile, use it
    const sp = req.staffProfile;

    // Owners get unrestricted scope
    if (sp?.isOwner) {
      req.scope = { tenantId: req.tenantId!, branchId: null };
      return next();
    }

    // TENANT-scoped roles get unrestricted branch access within their tenant
    if (sp?.role?.scope === 'TENANT') {
      req.scope = { tenantId: req.tenantId!, branchId: null };
      return next();
    }

    // BRANCH-scoped role — enforce branch isolation
    if (sp?.branchId) {
      req.scope = { tenantId: req.tenantId!, branchId: sp.branchId };
      return next();
    }

    // Fail closed: non-owner, non-tenant-scope actor with no assigned branch
    sendError(
      res,
      403,
      'SCOPE_MISCONFIGURED',
      'Your account has no assigned branch. Contact your administrator.'
    );
  };
}

/**
 * Utility: validate a client-supplied branchId against the resolved scope.
 * Returns the enforced branchId, or throws a 403 if the client tries to
 * access a branch they're not scoped to.
 */
export function enforceBranchScope(
  req: Request,
  res: Response,
  clientBranchId?: string | null
): string | undefined {
  const scopedBranch = req.scope?.branchId;

  // Unrestricted scope (Owner, Super Admin, TENANT-scoped role)
  if (scopedBranch === null || scopedBranch === undefined) {
    return clientBranchId || undefined;
  }

  // Branch-scoped: if client supplies a different branch, reject
  if (clientBranchId && clientBranchId !== scopedBranch) {
    sendError(
      res,
      403,
      'BRANCH_ACCESS_DENIED',
      'You do not have access to the requested branch.'
    );
    return '__BLOCKED__'; // sentinel value — caller must check and return early
  }

  // Always use the scoped branch
  return scopedBranch;
}
