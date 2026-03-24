import type { NextRequest, NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';

export { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';

export function getSessionCookieValue(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  const adminAuth = getAdminAuth();
  return adminAuth.verifyIdToken(idToken);
}

export async function createSessionCookie(idToken: string): Promise<string> {
  const adminAuth = getAdminAuth();
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked = true
): Promise<DecodedIdToken> {
  const adminAuth = getAdminAuth();
  return adminAuth.verifySessionCookie(sessionCookie, checkRevoked);
}

export async function revokeSession(sessionCookie?: string): Promise<void> {
  if (!sessionCookie) return;

  try {
    const decoded = await verifySessionCookie(sessionCookie, false);
    await getAdminAuth().revokeRefreshTokens(decoded.uid);
  } catch {
    // If the cookie is already invalid, clearing it client-side is enough.
  }
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
