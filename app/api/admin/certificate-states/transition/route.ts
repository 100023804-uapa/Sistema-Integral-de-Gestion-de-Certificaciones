import { NextRequest, NextResponse } from 'next/server';
import { getTransitionStateUseCase } from '@/lib/container';

export async function POST(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const userRole = searchParams.get('userRole');
    const pendingActions = searchParams.get('pendingActions') === 'true';
    
    const transitionStateUseCase = getTransitionStateUseCase();
    
    if (pendingActions && userRole) {
      // Obtener acciones pendientes para el rol del usuario
      const pendingStates = await transitionStateUseCase.getPendingActions(userRole);
      return NextResponse.json({ 
        success: true, 
        data: pendingStates 
      });
    } else if (certificateId && userRole) {
      // Obtener transiciones disponibles para un certificado
      const transitions = await transitionStateUseCase.getAvailableTransitions(certificateId, userRole);
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
