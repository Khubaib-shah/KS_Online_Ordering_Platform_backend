// ─── Staff Security — Rank-Based Role Hierarchy ─────────────────────
// Replaces the legacy regex-based role hierarchy with integer rank comparison.
// Higher rank = more authority. Actors can only mutate/assign targets with
// a strictly lower rank than their own.

export interface RoleInfo {
  rank: number;
  name?: string | null;
}

export interface ActorContext {
  isSuperAdmin?: boolean;
  isOwner?: boolean;
  role?: RoleInfo | null;
}

export interface TargetContext {
  isOwner?: boolean;
  role?: RoleInfo | null;
}

/**
 * Determines whether the actor can mutate (edit permissions, change role of)
 * a target staff member, optionally reassigning them to a new role.
 *
 * Rules:
 *  - Super Admin / Owner bypasses all checks.
 *  - Actor must have strictly greater rank than both the target's current
 *    role and the destination role.
 *  - An actor with rank 0 (no role) cannot mutate anyone.
 */
export function canMutateStaffRole(
  actor: ActorContext,
  target: TargetContext,
  nextRoleRank?: number | null,
): boolean {
  // Super Admin and Owner bypass all hierarchy checks
  if (actor.isSuperAdmin || actor.isOwner) return true;

  // Owners cannot be mutated by non-owners
  if (target.isOwner) return false;

  const actorRank = actor.role?.rank ?? 0;

  // An actor with rank 0 can never mutate anyone
  if (actorRank === 0) return false;

  const targetRank = target.role?.rank ?? 0;

  // Actor must outrank the target's current role
  if (actorRank <= targetRank) return false;

  // If changing to a new role, actor must also outrank the destination
  if (nextRoleRank !== undefined && nextRoleRank !== null) {
    if (actorRank <= nextRoleRank) return false;
  }

  return true;
}
