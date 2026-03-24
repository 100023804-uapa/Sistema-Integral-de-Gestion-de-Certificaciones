import { NextRequest, NextResponse } from 'next/server';
import { getCreateSignatureRequestUseCase } from '@/lib/container';
import { requireInternalUserRole } from '@/lib/auth/server';
import { notifySignatureRequest } from '@/lib/server/certificateWorkflowNotifications';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const body = await request.json();
    
    const createSignatureRequestUseCase = getCreateSignatureRequestUseCase();
    const signatureRequest = await createSignatureRequestUseCase.execute(
      {
        certificateId: body.certificateId,
        requestedTo: body.requestedTo,
        message: body.message,
        expiresInHours: body.expiresInHours
      },
      currentUser.uid,
      currentUser.primaryRole
    );

    await notifySignatureRequest(signatureRequest);

    return NextResponse.json({ 
      success: true, 
      data: signatureRequest 
    });

  } catch (error) {
    console.error('Error creating signature request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear solicitud de firma' },
      { status: 500 }
    );
  }
}
