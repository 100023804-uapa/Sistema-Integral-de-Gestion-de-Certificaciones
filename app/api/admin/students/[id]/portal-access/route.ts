import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { issueStudentTemporaryPassword } from '@/lib/server/studentAccounts';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action =
      body.action === 'reset-temporary-password'
        ? 'reset'
        : 'activate';

    const result = await issueStudentTemporaryPassword(
      decodeURIComponent(id),
      auth.user.uid,
      action
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error issuing student temporary password:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible generar el acceso temporal del participante',
      },
      { status: 400 }
    );
  }
}
