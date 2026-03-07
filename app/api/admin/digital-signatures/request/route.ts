import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getCreateSignatureRequestUseCase } from '@/lib/container';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createSignatureRequestUseCase = getCreateSignatureRequestUseCase();
    const signatureRequest = await createSignatureRequestUseCase.execute(
      {
        certificateId: body.certificateId,
        requestedTo: body.requestedTo,
        message: body.message,
        expiresInHours: body.expiresInHours,
      },
      body.requestedBy
    );

    return NextResponse.json({
      success: true,
      data: signatureRequest,
    });
  } catch (error) {
    console.error('Error creating signature request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear solicitud de firma' },
      { status: 500 }
    );
  }
}
