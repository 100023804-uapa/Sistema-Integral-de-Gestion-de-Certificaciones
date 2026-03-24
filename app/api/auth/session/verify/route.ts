import { NextRequest, NextResponse } from 'next/server';

import { getSessionCookieValue, verifySessionCookie } from '@/lib/auth/session';
import { SESSION_COOKIE_NAME, verifyAppSessionToken } from '@/lib/auth/app-session';
import { resolveSessionAccessFromDecodedToken } from '@/lib/server/studentPortal';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const firebaseSessionCookie = getSessionCookieValue(request);

    if (firebaseSessionCookie) {
      try {
        const decoded = await verifySessionCookie(firebaseSessionCookie, true);
        const access = await resolveSessionAccessFromDecodedToken(decoded);

        return NextResponse.json({
          valid: true,
          uid: decoded.uid,
          email: decoded.email ?? null,
          internalAccess: access.internalAccess,
          internalRole: access.internalRole,
          studentAccess: access.studentAccess,
          studentId: access.student?.studentId ?? null,
          studentStatus: access.student?.portalAccessStatus ?? null,
          mustChangePassword: access.student?.mustChangePassword === true,
        });
      } catch {
        // Continue to auxiliary session validation below.
      }
    }

    const appSessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (appSessionCookie) {
      const session = await verifyAppSessionToken(appSessionCookie);

      if (session) {
        return NextResponse.json({
          valid: true,
          uid: session.sub,
          email: session.email,
          internalAccess: true,
          internalRole: 'administrator',
          studentAccess: false,
          studentId: null,
          studentStatus: null,
          mustChangePassword: false,
        });
      }
    }

    return NextResponse.json(
      { valid: false, message: 'Sesión inválida' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { valid: false, message: 'Error verificando sesión' },
      { status: 401 }
    );
  }
}
