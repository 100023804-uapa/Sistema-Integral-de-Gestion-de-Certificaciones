import { NextRequest, NextResponse } from 'next/server';

import {
  APP_SESSION_MAX_AGE_SECONDS,
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  AppSessionConfigurationError,
  createAppSessionToken,
  getSessionCookieOptions,
} from '@/lib/auth/app-session';
import { FirebaseTokenVerificationError, verifyFirebaseIdToken } from '@/lib/auth/firebase-id-token';
import { getAccessRepository } from '@/lib/container';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
    }

    const verifiedUser = await verifyFirebaseIdToken(idToken);

    if (!verifiedUser.email) {
      return NextResponse.json(
        { success: false, error: 'La cuenta autenticada no tiene correo disponible.' },
        { status: 403 }
      );
    }

    const accessRepository = getAccessRepository();
    const hasAdminAccess = await accessRepository.hasAdminAccess(verifiedUser.email);

    if (!hasAdminAccess) {
      return NextResponse.json(
        { success: false, error: 'La cuenta no tiene acceso administrativo.' },
        { status: 403 }
      );
    }

    const { token, payload } = await createAppSessionToken({
      uid: verifiedUser.uid,
      email: verifiedUser.email,
    });

    const response = NextResponse.json({
      success: true,
      session: {
        uid: payload.sub,
        email: payload.email,
        expiresAt: payload.exp,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(APP_SESSION_MAX_AGE_SECONDS));
    response.cookies.set(LEGACY_SESSION_COOKIE_NAME, '', getSessionCookieOptions(0));

    return response;
  } catch (error) {
    console.error('Login session error:', error);

    if (error instanceof FirebaseTokenVerificationError) {
      return NextResponse.json(
        { success: false, error: 'No fue posible validar la identidad del usuario.' },
        { status: 401 }
      );
    }

    if (error instanceof AppSessionConfigurationError) {
      return NextResponse.json(
        { success: false, error: 'La sesion del servidor no esta configurada correctamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'No fue posible crear la sesion. Intentelo de nuevo.' },
      { status: 500 }
    );
  }
}
