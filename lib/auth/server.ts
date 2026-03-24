import { NextRequest, NextResponse } from 'next/server';
import { getRoleFromClaims, hasInternalAccessClaim } from '@/lib/auth/claims';
import { hasAnyAllowedRole } from '@/lib/auth/permissions';
import { FirebaseAccessRepository } from '@/lib/infrastructure/repositories/FirebaseAccessRepository';
import { getSessionCookieValue, verifySessionCookie } from '@/lib/auth/session';
import type { RoleValue } from '@/lib/types/role';

export interface AuthenticatedInternalUser {
  uid: string;
  email: string;
  roles: string[];
  primaryRole: string;
}

function unauthorizedResponse(message = 'No autenticado') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

function forbiddenResponse(message = 'Permiso denegado') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export async function getAuthenticatedInternalUser(
  request: NextRequest
): Promise<AuthenticatedInternalUser | null> {
  const sessionCookie = getSessionCookieValue(request);
  if (!sessionCookie) return null;

  const decoded = await verifySessionCookie(sessionCookie, true);
  const email = decoded.email?.trim().toLowerCase();
  if (!email) return null;

  const roleFromClaims = getRoleFromClaims(decoded as unknown as Record<string, unknown>);
  if (hasInternalAccessClaim(decoded as unknown as Record<string, unknown>) && roleFromClaims) {
    return {
      uid: decoded.uid,
      email,
      roles: [roleFromClaims],
      primaryRole: roleFromClaims,
    };
  }

  const accessRepo = new FirebaseAccessRepository();
  const hasAdminAccess = await accessRepo.hasAdminAccess(email);
  const bootstrapAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();

  if (!hasAdminAccess && email !== bootstrapAdminEmail) {
    return null;
  }

  return {
    uid: decoded.uid,
    email,
    roles: ['administrator'],
    primaryRole: 'administrator',
  };
}

export async function requireAuthenticatedInternalUser(
  request: NextRequest
): Promise<
  | { user: AuthenticatedInternalUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  try {
    const sessionCookie = getSessionCookieValue(request);
    if (!sessionCookie) {
      return { response: unauthorizedResponse() };
    }

    const user = await getAuthenticatedInternalUser(request);
    if (!user) {
      return { response: forbiddenResponse() };
    }

    return { user };
  } catch {
    return { response: unauthorizedResponse('Sesión inválida') };
  }
}

export async function requireInternalUserRole(
  request: NextRequest,
  allowedRoles: readonly RoleValue[]
): Promise<
  | { user: AuthenticatedInternalUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth;
  }

  if (!hasAnyAllowedRole(auth.user.roles, allowedRoles)) {
    return { response: forbiddenResponse() };
  }

  return auth;
}
