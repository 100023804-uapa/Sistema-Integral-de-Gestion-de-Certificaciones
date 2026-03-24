import { NextRequest, NextResponse } from 'next/server';
import { getGetStateHistoryUseCase, getCreateCertificateStateUseCase } from '@/lib/container';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const userId = searchParams.get('userId');
    const state = searchParams.get('state');
    
    const getStateHistoryUseCase = getGetStateHistoryUseCase();
    
    if (certificateId) {
      // Obtener historial de un certificado específico
      const history = await getStateHistoryUseCase.execute(certificateId);
      return NextResponse.json({ 
        success: true, 
        data: history 
      });
    } else if (userId) {
      // Obtener estados actuales visibles para el rol del usuario
      const states =
        userId === 'self'
          ? await getStateHistoryUseCase.getVisibleCurrentStates(
              currentUser.primaryRole,
              state || undefined
            )
          : await getStateHistoryUseCase.getStatesByUser(
              currentUser.uid,
              state || undefined
            );
      return NextResponse.json({ 
        success: true, 
        data: states 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere certificateId o userId' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error fetching certificate states:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estados del certificado' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const body = await request.json();
    
    const createCertificateStateUseCase = getCreateCertificateStateUseCase();
    const state = await createCertificateStateUseCase.execute(
      body.certificateId,
      body.initialState,
      currentUser.uid
    );

    return NextResponse.json({ 
      success: true, 
      data: state 
    });

  } catch (error) {
    console.error('Error creating certificate state:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear estado del certificado' },
      { status: 500 }
    );
  }
}
