import { NextRequest, NextResponse } from 'next/server';
import { getTransitionStateUseCase } from '@/lib/container';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import {
  notifyPendingReview,
  notifyReturnedToDraft,
} from '@/lib/server/certificateWorkflowNotifications';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const body = await request.json();
    
    const transitionStateUseCase = getTransitionStateUseCase();
    const newState = await transitionStateUseCase.execute(
      body.certificateId,
      body.newState,
      currentUser.uid,
      currentUser.primaryRole,
      body.comments
    );

    if (newState.currentState === 'pending_review') {
      await notifyPendingReview(newState.certificateId, newState.comments);
    }

    if (
      newState.currentState === 'draft' &&
      newState.previousState === 'pending_review' &&
      newState.metadata &&
      typeof newState.metadata.previousChangedBy === 'string'
    ) {
      await notifyReturnedToDraft(
        newState.certificateId,
        newState.metadata.previousChangedBy,
        newState.comments,
        currentUser.uid
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: newState 
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
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const pendingActions = searchParams.get('pendingActions') === 'true';
    
    const transitionStateUseCase = getTransitionStateUseCase();
    
    if (pendingActions) {
      // Obtener acciones pendientes para el rol del usuario
      const pendingStates = await transitionStateUseCase.getPendingActions(currentUser.primaryRole);
      return NextResponse.json({ 
        success: true, 
        data: pendingStates 
      });
    } else if (certificateId) {
      // Obtener transiciones disponibles para un certificado
      const transitions = await transitionStateUseCase.getAvailableManualTransitions(
        certificateId,
        currentUser.primaryRole
      );
      return NextResponse.json({ 
        success: true, 
        data: transitions 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error getting certificate transitions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener transiciones del certificado' },
      { status: 500 }
    );
  }
}
