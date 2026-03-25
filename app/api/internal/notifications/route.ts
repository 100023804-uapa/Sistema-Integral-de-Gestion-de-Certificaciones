import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { listNotificationsForInternalUser } from '@/lib/server/notifications';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const limitParam = new URL(request.url).searchParams.get('limit');
    const parsedLimit = Number(limitParam);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 50)
        : 12;

    const result = await listNotificationsForInternalUser(auth.user.uid, limit);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing internal notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No fue posible listar las notificaciones.',
      },
      { status: 500 }
    );
  }
}
