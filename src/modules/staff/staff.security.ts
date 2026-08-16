export const STAFF_ROLE_ORDER = {
  Owner: 3,
  Manager: 2,
  Staff: 1,
} as const;

export type StaffRoleName = keyof typeof STAFF_ROLE_ORDER;

export function getRoleRank(roleName?: string | null): number {
  if (!roleName) return 0;
  const normalized = roleName.trim();

  if (/owner/i.test(normalized)) return STAFF_ROLE_ORDER.Owner;
  if (/manager/i.test(normalized)) return STAFF_ROLE_ORDER.Manager;
  if (/staff/i.test(normalized)) return STAFF_ROLE_ORDER.Staff;

  return 0;
}

export function canMutateStaffRole(
  actor: { isOwner?: boolean; role?: { name?: string | null } | null },
  target: { isOwner?: boolean; role?: { name?: string | null } | null },
  nextRoleName?: string | null,
): boolean {
  if (actor.isOwner) return true;

  const actorRank = getRoleRank(actor.role?.name ?? null);
  if (actorRank === 0) return false;

  const targetRank = getRoleRank(target.role?.name ?? null);
  const desiredRank = getRoleRank(nextRoleName ?? target.role?.name ?? null);

  if (desiredRank >= actorRank) return false;
  if (targetRank > actorRank) return false;

  return true;
}
