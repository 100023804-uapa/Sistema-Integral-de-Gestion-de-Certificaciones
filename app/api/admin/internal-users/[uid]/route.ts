import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { updateInternalUser } from '@/lib/server/internalUsers';

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { uid } = await context.params;
    const body = await request.json();
    const currentUser = auth.user!;
    const user = await updateInternalUser(
      uid,
      {
        displayName: body.displayName,
        roleCode: body.roleCode,
        status: body.status,
        resendInvite: body.resendInvite === true,
      },
      currentUser.uid
    );

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating internal user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'No fue posible actualizar el usuario interno',
      },
      { status: 400 }
    );
  }
}
