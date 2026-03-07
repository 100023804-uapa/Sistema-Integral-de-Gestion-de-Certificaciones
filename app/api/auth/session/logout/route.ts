import { NextResponse, NextRequest } from 'next/server';

import {
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from '@/lib/auth/app-session';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, '', getSessionCookieOptions(0));
    response.cookies.set(LEGACY_SESSION_COOKIE_NAME, '', getSessionCookieOptions(0));

    return response;
  } catch (error) {
    console.error('Logout session error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible cerrar la sesion. Intentelo de nuevo.' },
      { status: 500 }
    );
  }
}
