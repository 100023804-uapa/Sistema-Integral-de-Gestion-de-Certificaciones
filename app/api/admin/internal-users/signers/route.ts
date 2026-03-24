import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { listInternalUsers } from '@/lib/server/internalUsers';

export async function GET(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const users = await listInternalUsers();
    const signers = users.filter(
      (user) =>
        user.status !== 'disabled' &&
        (user.roleCode === 'signer' || user.roleCode === 'administrator')
    );

    return NextResponse.json({ success: true, data: signers });
  } catch (error) {
    console.error('Error listing signer candidates:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible listar los firmantes disponibles' },
      { status: 500 }
    );
  }
}
