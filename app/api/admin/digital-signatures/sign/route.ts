import { NextRequest, NextResponse } from 'next/server';
import {
  getGetSignatureRequestsUseCase,
  getSignCertificateUseCase,
  getRejectSignatureUseCase,
} from '@/lib/container';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { notifySignatureOutcome } from '@/lib/server/certificateWorkflowNotifications';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const body = await request.json();
    const { action } = body;
    
    if (action === 'sign') {
      const getSignatureRequestsUseCase = getGetSignatureRequestsUseCase();
      const relatedRequest = await getSignatureRequestsUseCase.getRequestByCertificate(
        body.certificateId
      );
      const signCertificateUseCase = getSignCertificateUseCase();
      const signature = await signCertificateUseCase.execute(
        {
          certificateId: body.certificateId,
          signatureBase64: body.signatureBase64,
          comments: body.comments,
          ipAddress:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '',
          userAgent: request.headers.get('user-agent') || '',
          location: body.location
        },
        currentUser.uid,
        currentUser.primaryRole
      );

      if (relatedRequest) {
        await notifySignatureOutcome({
          request: relatedRequest,
          approved: true,
          details: body.comments,
        });
      }

      return NextResponse.json({ 
        success: true, 
        data: signature 
      });
    } else if (action === 'reject') {
      const getSignatureRequestsUseCase = getGetSignatureRequestsUseCase();
      const relatedRequest = await getSignatureRequestsUseCase.getRequestByCertificate(
        body.certificateId
      );
      const rejectSignatureUseCase = getRejectSignatureUseCase();
      await rejectSignatureUseCase.execute(
        body.certificateId,
        body.rejectionReason,
        currentUser.uid,
        currentUser.primaryRole
      );

      if (relatedRequest) {
        await notifySignatureOutcome({
          request: relatedRequest,
          approved: false,
          details: body.rejectionReason,
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Solicitud de firma rechazada' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción no válida' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing signature:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al procesar firma' },
      { status: 500 }
    );
  }
}
