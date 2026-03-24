import { NextRequest, NextResponse } from 'next/server';

import {
  SESSION_COOKIE,
  createSessionCookie,
  getSessionCookieOptions as getFirebaseSessionCookieOptions,
  verifyIdToken,
} from '@/lib/auth/session';
import {
  APP_SESSION_MAX_AGE_SECONDS,
  AppSessionConfigurationError,
  SESSION_COOKIE_NAME,
  createAppSessionToken,
  getSessionCookieOptions as getAppSessionCookieOptions,
} from '@/lib/auth/app-session';
import { hasInternalAccessClaim } from '@/lib/auth/claims';
import { markInternalUserLogin } from '@/lib/server/internalUsers';
import { markStudentPortalLogin } from '@/lib/server/studentAccounts';
import { resolveSessionAccessFromDecodedToken } from '@/lib/server/studentPortal';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
    }

    const decodedToken = await verifyIdToken(idToken);
    const access = await resolveSessionAccessFromDecodedToken(decodedToken);

    if (!access.internalAccess && !access.studentAccess) {
      return NextResponse.json(
        { success: false, error: 'La cuenta autenticada no tiene acceso a SIGCE.' },
        { status: 403 }
      );
    }

    if (hasInternalAccessClaim(decodedToken as unknown as Record<string, unknown>)) {
      await markInternalUserLogin(decodedToken.uid);
    }

    if (access.studentAccess && access.student) {
      await markStudentPortalLogin(access.student.studentId);
    }

    const firebaseSessionCookie = await createSessionCookie(idToken);
    const response = NextResponse.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      internalAccess: access.internalAccess,
      internalRole: access.internalRole,
      studentAccess: access.studentAccess,
      studentId: access.student?.studentId ?? null,
      studentStatus: access.student?.portalAccessStatus ?? null,
      mustChangePassword: access.student?.mustChangePassword === true,
    });

    response.cookies.set(
      SESSION_COOKIE,
      firebaseSessionCookie,
      getFirebaseSessionCookieOptions()
    );

    if (access.internalAccess && decodedToken.email) {
      try {
        const { token } = await createAppSessionToken({
          uid: decodedToken.uid,
          email: decodedToken.email,
        });

        response.cookies.set(
          SESSION_COOKIE_NAME,
          token,
          getAppSessionCookieOptions(APP_SESSION_MAX_AGE_SECONDS)
        );
      } catch (error) {
        if (!(error instanceof AppSessionConfigurationError)) {
          throw error;
        }

        console.warn('No se pudo emitir la sesión administrativa auxiliar:', error.message);
        response.cookies.set(SESSION_COOKIE_NAME, '', getAppSessionCookieOptions(0));
      }
    } else {
      response.cookies.set(SESSION_COOKIE_NAME, '', getAppSessionCookieOptions(0));
    }

    return response;
  } catch (error) {
    console.error('Login session error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible crear la sesión. Inténtelo de nuevo.' },
      { status: 500 }
    );
  }
}
