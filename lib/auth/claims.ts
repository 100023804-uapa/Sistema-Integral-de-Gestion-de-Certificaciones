import type { RoleValue } from '@/lib/types/role';

export const SIGCE_INTERNAL_CLAIM = 'sigce_internal';
export const SIGCE_ROLE_CLAIM = 'sigce_role';

export function isRoleValue(value: unknown): value is RoleValue {
  return (
    value === 'administrator' ||
    value === 'coordinator' ||
    value === 'verifier' ||
    value === 'signer'
  );
}

export function buildInternalUserClaims(roleCode: RoleValue) {
  return {
    [SIGCE_INTERNAL_CLAIM]: true,
    [SIGCE_ROLE_CLAIM]: roleCode,
  };
}

export function getRoleFromClaims(claims: Record<string, unknown>): RoleValue | null {
  const role = claims[SIGCE_ROLE_CLAIM];
  return isRoleValue(role) ? role : null;
}

export function hasInternalAccessClaim(claims: Record<string, unknown>): boolean {
  return claims[SIGCE_INTERNAL_CLAIM] === true && getRoleFromClaims(claims) !== null;
}
