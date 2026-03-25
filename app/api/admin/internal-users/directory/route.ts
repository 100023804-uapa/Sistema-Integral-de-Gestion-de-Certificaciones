import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { listInternalUsers } from '@/lib/server/internalUsers';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const users = await listInternalUsers();
    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error('Error listing internal user directory:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible cargar el directorio de usuarios internos' },
      { status: 500 }
    );
  }
}
