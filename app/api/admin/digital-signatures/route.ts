import { NextRequest, NextResponse } from 'next/server';
import { getGetSignatureRequestsUseCase } from '@/lib/container';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedInternalUser(request);
    if (auth.response) {
      return auth.response;
    }
    const currentUser = auth.user!;

    const { searchParams } = new URL(request.url);
    const signerId = searchParams.get('signerId');
    const requestedBy = searchParams.get('requestedBy');
    const certificateId = searchParams.get('certificateId');
    const status = searchParams.get('status');
    
    const getSignatureRequestsUseCase = getGetSignatureRequestsUseCase();
    
    if (signerId) {
      // Obtener solicitudes por firmante
      const requests = await getSignatureRequestsUseCase.getRequestsBySigner(
        currentUser.uid,
        status || undefined
      );
      return NextResponse.json({ 
        success: true, 
        data: requests 
      });
    } else if (requestedBy) {
      // Obtener solicitudes por solicitante
      const requests = await getSignatureRequestsUseCase.getRequestsByRequester(currentUser.uid);
      return NextResponse.json({ 
        success: true, 
        data: requests 
      });
    } else if (certificateId) {
      // Obtener solicitud por certificado
      const request = await getSignatureRequestsUseCase.getRequestByCertificate(certificateId);
      const signature = await getSignatureRequestsUseCase.getSignatureByCertificate(certificateId);
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          request, 
          signature 
        } 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere signerId, requestedBy o certificateId' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error fetching signature requests:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes de firma' },
      { status: 500 }
    );
  }
}
