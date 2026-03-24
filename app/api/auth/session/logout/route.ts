import { NextRequest, NextResponse } from 'next/server';

import {
  clearSessionCookie,
  getSessionCookieValue,
  revokeSession,
} from '@/lib/auth/session';
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions as getAppSessionCookieOptions,
} from '@/lib/auth/app-session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = getSessionCookieValue(request);
    await revokeSession(sessionCookie);

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    response.cookies.set(SESSION_COOKIE_NAME, '', getAppSessionCookieOptions(0));

    return response;
  } catch (error) {
    console.error('Logout session error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible cerrar la sesión. Inténtelo de nuevo.' },
      { status: 500 }
    );
  }
}
