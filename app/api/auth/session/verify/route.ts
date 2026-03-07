import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, verifyAppSessionToken } from '@/lib/auth/app-session';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({
        valid: false,
        message: 'Sesion invalida',
      });
    }

    const session = await verifyAppSessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json({
        valid: false,
        message: 'Sesion invalida',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Sesion valida',
      session: {
        uid: session.sub,
        email: session.email,
        expiresAt: session.exp,
      },
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { valid: false, message: 'Error verificando sesion' },
      { status: 500 }
    );
  }
}
