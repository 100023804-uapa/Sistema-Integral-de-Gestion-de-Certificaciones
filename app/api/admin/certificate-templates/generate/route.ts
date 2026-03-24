import { NextRequest, NextResponse } from 'next/server';

import { requireInternalUserRole } from '@/lib/auth/server';
import { getGenerateCertificateUseCase } from '@/lib/container';
import { notifyCertificateIssued } from '@/lib/server/certificateWorkflowNotifications';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const body = await request.json();

    const generateCertificateUseCase = getGenerateCertificateUseCase();
    const generatedCertificate = await generateCertificateUseCase.execute(
      body.certificateId,
      body.templateId,
      {
        includeQR: body.includeQR !== false,
        includeSignature: body.includeSignature !== false,
        watermark: body.watermark || false,
        quality: body.quality || 'medium',
      },
      currentUser.uid,
      currentUser.primaryRole
    );

    await notifyCertificateIssued(body.certificateId).catch((error) => {
      console.error('Error sending issued certificate notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: generatedCertificate,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al generar certificado' },
      { status: 500 }
    );
  }
}
