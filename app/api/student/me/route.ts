import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieValue } from '@/lib/auth/session';
import { resolveSessionAccessFromSessionCookie } from '@/lib/server/studentPortal';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = getSessionCookieValue(request);
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const access = await resolveSessionAccessFromSessionCookie(sessionCookie);

    if (access.internalAccess) {
      return NextResponse.json(
        { success: false, error: 'Este acceso es solo para participantes' },
        { status: 403 }
      );
    }

    if (!access.studentAccess || !access.student) {
      return NextResponse.json(
        {
          success: false,
          error: 'La cuenta no está vinculada a un participante activo',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: access.student,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Sesión inválida' },
      { status: 401 }
    );
  }
}
