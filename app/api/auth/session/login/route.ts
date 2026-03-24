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
import { FirebaseAdminConfigurationError } from '@/lib/firebaseAdmin';
import { markInternalUserLogin } from '@/lib/server/internalUsers';
import { markStudentPortalLogin } from '@/lib/server/studentAccounts';
import { resolveSessionAccessFromDecodedToken } from '@/lib/server/studentPortal';

export const runtime = 'nodejs';

type SessionLoginErrorCode =
  | 'missing-id-token'
  | 'account-without-access'
  | 'firebase-admin-missing-credentials'
  | 'firebase-admin-invalid-credentials'
  | 'firebase-admin-project-mismatch'
  | 'firebase-token-project-mismatch'
  | 'token-verify-failed'
  | 'access-resolution-failed'
  | 'session-cookie-create-failed'
  | 'session-create-failed';

class SessionLoginRouteError extends Error {
  constructor(
    public readonly code: SessionLoginErrorCode,
    public readonly status: number,
    message: string,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'SessionLoginRouteError';
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function isFirebaseTokenProjectMismatch(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes('incorrect aud') ||
    message.includes('incorrect "aud"') ||
    message.includes('audience') ||
    message.includes('project id') ||
    message.includes('project mismatch') ||
    message.includes('issuer')
  );
}

function mapSessionLoginError(
  error: unknown,
  fallbackCode: SessionLoginErrorCode,
  fallbackMessage: string,
  fallbackStatus = 500
): SessionLoginRouteError {
  if (error instanceof SessionLoginRouteError) {
    return error;
  }

  if (error instanceof FirebaseAdminConfigurationError) {
    return new SessionLoginRouteError(error.code, 500, fallbackMessage, error.message);
  }

  if (isFirebaseTokenProjectMismatch(error)) {
    return new SessionLoginRouteError(
      'firebase-token-project-mismatch',
      500,
      'El token de Firebase no coincide con el proyecto configurado en el servidor.',
      getErrorMessage(error)
    );
  }

  return new SessionLoginRouteError(
    fallbackCode,
    fallbackStatus,
    fallbackMessage,
    getErrorMessage(error)
  );
}

function shouldExposeSessionErrorDetail(code: SessionLoginErrorCode) {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return (
    code === 'firebase-admin-missing-credentials' ||
    code === 'firebase-admin-invalid-credentials' ||
    code === 'firebase-admin-project-mismatch' ||
    code === 'firebase-token-project-mismatch'
  );
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        {
          success: false,
          code: 'missing-id-token',
          error: 'Missing idToken',
        },
        { status: 400 }
      );
    }

    const decodedToken = await verifyIdToken(idToken).catch((error) => {
      throw mapSessionLoginError(
        error,
        'token-verify-failed',
        'No fue posible validar el token de Firebase.',
        401
      );
    });

    const access = await resolveSessionAccessFromDecodedToken(decodedToken).catch((error) => {
      throw mapSessionLoginError(
        error,
        'access-resolution-failed',
        'No fue posible resolver los permisos de acceso de la cuenta.'
      );
    });

    if (!access.internalAccess && !access.studentAccess) {
      return NextResponse.json(
        {
          success: false,
          code: 'account-without-access',
          error: 'La cuenta autenticada no tiene acceso a SIGCE.',
        },
        { status: 403 }
      );
    }

    if (hasInternalAccessClaim(decodedToken as unknown as Record<string, unknown>)) {
      try {
        await markInternalUserLogin(decodedToken.uid);
      } catch (error) {
        console.warn('No se pudo registrar el ultimo acceso interno:', getErrorMessage(error));
      }
    }

    if (access.studentAccess && access.student) {
      try {
        await markStudentPortalLogin(access.student.studentId);
      } catch (error) {
        console.warn(
          'No se pudo registrar el ultimo acceso del participante:',
          getErrorMessage(error)
        );
      }
    }

    const firebaseSessionCookie = await createSessionCookie(idToken).catch((error) => {
      throw mapSessionLoginError(
        error,
        'session-cookie-create-failed',
        'No fue posible crear la cookie segura de sesión.'
      );
    });

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
    const sessionError = mapSessionLoginError(
      error,
      'session-create-failed',
      'No fue posible crear la sesión. Inténtelo de nuevo.'
    );

    console.error('Login session error:', {
      code: sessionError.code,
      status: sessionError.status,
      message: sessionError.message,
      detail: sessionError.detail,
    });

    return NextResponse.json(
      {
        success: false,
        code: sessionError.code,
        error: sessionError.message,
        ...(shouldExposeSessionErrorDetail(sessionError.code) && sessionError.detail
          ? { detail: sessionError.detail }
          : {}),
      },
      { status: sessionError.status }
    );
  }
}
