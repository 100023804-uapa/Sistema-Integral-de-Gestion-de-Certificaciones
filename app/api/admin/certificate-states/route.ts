import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import {
  getGetStateHistoryUseCase,
  getCreateCertificateStateUseCase,
  getCertificateStateRepository,
} from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const userId = searchParams.get('userId');
    const state = searchParams.get('state');

    const getStateHistoryUseCase = getGetStateHistoryUseCase();

    if (certificateId) {
      const history = await getStateHistoryUseCase.execute(certificateId);
      return NextResponse.json({
        success: true,
        data: history,
      });
    }

    if (userId) {
      const states = await getStateHistoryUseCase.getStatesByUser(userId, state || undefined);
      return NextResponse.json({
        success: true,
        data: states,
      });
    }

    const stateRepo = getCertificateStateRepository();
    const allStates = await stateRepo.listAll(state || undefined);
    return NextResponse.json({
      success: true,
      data: allStates,
    });
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
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createCertificateStateUseCase = getCreateCertificateStateUseCase();
    const state = await createCertificateStateUseCase.execute(
      body.certificateId,
      body.initialState,
      body.changedBy
    );

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Error creating certificate state:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear estado del certificado' },
      { status: 500 }
    );
  }
}
