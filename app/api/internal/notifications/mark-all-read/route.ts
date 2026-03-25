import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { markAllNotificationsReadForInternalUser } from '@/lib/server/notifications';

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const updatedCount = await markAllNotificationsReadForInternalUser(auth.user.uid);

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No fue posible marcar las notificaciones como leídas.',
      },
      { status: 500 }
    );
  }
}
