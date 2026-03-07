import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getTransitionStateUseCase } from '@/lib/container';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const transitionStateUseCase = getTransitionStateUseCase();
    const newState = await transitionStateUseCase.execute(
      body.certificateId,
      body.newState,
      body.changedBy,
      body.userRole,
      body.comments
    );

    return NextResponse.json({
      success: true,
      data: newState,
    });
  } catch (error) {
    console.error('Error transitioning certificate state:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al transicionar estado del certificado' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const userRole = searchParams.get('userRole');
    const pendingActions = searchParams.get('pendingActions') === 'true';

    const transitionStateUseCase = getTransitionStateUseCase();

    if (pendingActions && userRole) {
      const pendingStates = await transitionStateUseCase.getPendingActions(userRole);
      return NextResponse.json({
        success: true,
        data: pendingStates,
      });
    }

    if (certificateId && userRole) {
      const transitions = await transitionStateUseCase.getAvailableTransitions(certificateId, userRole);
      return NextResponse.json({
        success: true,
        data: transitions,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Parametros invalidos' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting certificate transitions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener transiciones del certificado' },
      { status: 500 }
    );
  }
}
