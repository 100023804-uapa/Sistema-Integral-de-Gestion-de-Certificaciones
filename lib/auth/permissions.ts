import type { RoleValue } from '@/lib/types/role';

export const INTERNAL_ROLE_VALUES: RoleValue[] = [
  'administrator',
  'coordinator',
  'verifier',
  'signer',
];

type DashboardRouteRule = {
  path: string;
  allowedRoles?: readonly RoleValue[];
};

export const DASHBOARD_ROUTE_RULES: DashboardRouteRule[] = [
  { path: '/dashboard/reports', allowedRoles: ['administrator', 'coordinator'] },
  { path: '/dashboard/campuses', allowedRoles: ['administrator'] },
  { path: '/dashboard/academic-areas', allowedRoles: ['administrator'] },
  { path: '/dashboard/certificate-types', allowedRoles: ['administrator'] },
  { path: '/dashboard/roles', allowedRoles: ['administrator'] },
  { path: '/dashboard/programs', allowedRoles: ['administrator', 'coordinator'] },
  { path: '/dashboard/graduates', allowedRoles: ['administrator', 'coordinator', 'verifier'] },
  { path: '/dashboard/certificate-states', allowedRoles: ['administrator', 'coordinator'] },
  { path: '/dashboard/digital-signatures', allowedRoles: ['administrator', 'signer'] },
  { path: '/dashboard/certificate-templates', allowedRoles: ['administrator', 'coordinator'] },
  { path: '/dashboard/users', allowedRoles: ['administrator'] },
  { path: '/dashboard/settings', allowedRoles: ['administrator'] },
];

export function normalizeRole(role: string): RoleValue | null {
  if (role === 'admin') {
    return 'administrator';
  }

  return INTERNAL_ROLE_VALUES.includes(role as RoleValue)
    ? (role as RoleValue)
    : null;
}

export function normalizeRoles(roles: string[]): RoleValue[] {
  const normalized = new Set<RoleValue>();

  for (const role of roles) {
    const parsed = normalizeRole(role);
    if (parsed) {
      normalized.add(parsed);
    }
  }

  return Array.from(normalized);
}

export function hasAnyAllowedRole(
  roles: string[],
  allowedRoles?: readonly RoleValue[]
): boolean {
  const normalizedRoles = normalizeRoles(roles);

  if (normalizedRoles.length === 0) {
    return false;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return normalizedRoles.some((role) => allowedRoles.includes(role));
}

export function getAllowedRolesForDashboardPath(
  pathname: string
): readonly RoleValue[] | null {
  const match = [...DASHBOARD_ROUTE_RULES]
    .sort((left, right) => right.path.length - left.path.length)
    .find((rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`));

  return match?.allowedRoles ?? null;
}
