import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieValue } from '@/lib/auth/session';
import { resolveSessionAccessFromSessionCookie } from '@/lib/server/studentPortal';
import { completeStudentPasswordChange } from '@/lib/server/studentAccounts';

function validatePassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = getSessionCookieValue(request);
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const access = await resolveSessionAccessFromSessionCookie(sessionCookie);
    if (!access.studentAccess || !access.student) {
      return NextResponse.json(
        { success: false, error: 'Este acceso es solo para participantes' },
        { status: 403 }
      );
    }

    if (!access.student.mustChangePassword) {
      return NextResponse.json(
        { success: false, error: 'La cuenta no requiere un cambio obligatorio de contraseña' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!validatePassword(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        },
        { status: 400 }
      );
    }

    if (newPassword.toLowerCase().includes(access.student.studentId.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'La nueva contraseña no debe contener la matrícula del participante' },
        { status: 400 }
      );
    }

    await completeStudentPasswordChange(
      access.student.studentId,
      access.uid,
      newPassword
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada. Debes iniciar sesión nuevamente con tu nueva contraseña.',
    });
  } catch (error) {
    console.error('Error changing student password:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'No fue posible cambiar la contraseña',
      },
      { status: 400 }
    );
  }
}
