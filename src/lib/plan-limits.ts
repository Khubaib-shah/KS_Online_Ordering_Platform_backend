// ─── Plan Limit Enforcement ─────────────────────────────────────────
import { prisma } from '../config/database';
import { ValidationError } from './errors';

/**
 * Enforces the tenant's plan limits before creating plan-limited resources.
 * No-op when the tenant has no plan or the limit is null (unlimited).
 */
export async function enforcePlanLimit(
  tenantId: string,
  resource: 'BRANCH' | 'MENU_ITEM'
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
  if (!tenant) return;

  const limit =
    resource === 'BRANCH' ? tenant.plan?.maxBranches : tenant.plan?.maxMenuItems;
  if (limit == null || limit <= 0) return;

  const count =
    resource === 'BRANCH'
      ? await prisma.branch.count({ where: { tenantId } })
      : await prisma.menuItem.count({ where: { tenantId } });

  if (count >= limit) {
    const label = resource === 'BRANCH' ? 'branches' : 'menu items';
    throw new ValidationError(
      `Your current plan allows up to ${limit} ${label}. Please upgrade your plan to add more.`
    );
  }
}
