import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import {
  createInternalUser,
  listInternalUsers,
} from '@/lib/server/internalUsers';

export async function GET(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const users = await listInternalUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error listing internal users:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible listar los usuarios internos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const currentUser = auth.user!;
    const user = await createInternalUser(
      {
        email: body.email,
        displayName: body.displayName,
        roleCode: body.roleCode,
      },
      currentUser.uid
    );

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error creating internal user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'No fue posible crear el usuario interno',
      },
      { status: 400 }
    );
  }
}
