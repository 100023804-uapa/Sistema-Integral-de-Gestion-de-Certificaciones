import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import {
  deleteNotificationForInternalUser,
  markNotificationReadStateForInternalUser,
} from '@/lib/server/notifications';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'read' | 'unread';
    };

    if (body.action !== 'read' && body.action !== 'unread') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acción de notificación no válida.',
        },
        { status: 400 }
      );
    }

    const updatedNotification = await markNotificationReadStateForInternalUser(
      auth.user.uid,
      id,
      body.action === 'read'
    );

    return NextResponse.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar la notificación.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const deletedNotification = await deleteNotificationForInternalUser(auth.user.uid, id);

    return NextResponse.json({
      success: true,
      data: deletedNotification,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible eliminar la notificación.',
      },
      { status: 400 }
    );
  }
}
