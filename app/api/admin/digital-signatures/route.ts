import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getGetSignatureRequestsUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const signerId = searchParams.get('signerId');
    const requestedBy = searchParams.get('requestedBy');
    const certificateId = searchParams.get('certificateId');
    const status = searchParams.get('status');

    const getSignatureRequestsUseCase = getGetSignatureRequestsUseCase();

    if (signerId) {
      const requests = await getSignatureRequestsUseCase.getRequestsBySigner(signerId, status || undefined);
      return NextResponse.json({
        success: true,
        data: requests,
      });
    }

    if (requestedBy) {
      const requests = await getSignatureRequestsUseCase.getRequestsByRequester(requestedBy);
      return NextResponse.json({
        success: true,
        data: requests,
      });
    }

    if (certificateId) {
      const requestData = await getSignatureRequestsUseCase.getRequestByCertificate(certificateId);
      const signature = await getSignatureRequestsUseCase.getSignatureByCertificate(certificateId);

      return NextResponse.json({
        success: true,
        data: {
          request: requestData,
          signature,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Se requiere signerId, requestedBy o certificateId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching signature requests:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes de firma' },
      { status: 500 }
    );
  }
}
