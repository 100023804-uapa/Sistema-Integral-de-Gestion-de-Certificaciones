import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getSignCertificateUseCase, getRejectSignatureUseCase } from '@/lib/container';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { action } = body;

    if (action === 'sign') {
      const signCertificateUseCase = getSignCertificateUseCase();
      const signature = await signCertificateUseCase.execute(
        {
          certificateId: body.certificateId,
          signatureBase64: body.signatureBase64,
          comments: body.comments,
          location: body.location,
        },
        body.signerId
      );

      return NextResponse.json({
        success: true,
        data: signature,
      });
    }

    if (action === 'reject') {
      const rejectSignatureUseCase = getRejectSignatureUseCase();
      await rejectSignatureUseCase.execute(body.certificateId, body.rejectionReason, body.signerId);

      return NextResponse.json({
        success: true,
        message: 'Solicitud de firma rechazada',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Accion no valida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing signature:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al procesar firma' },
      { status: 500 }
    );
  }
}
