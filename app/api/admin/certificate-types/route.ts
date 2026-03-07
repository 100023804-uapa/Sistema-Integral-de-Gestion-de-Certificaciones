import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListCertificateTypesUseCase, getCreateCertificateTypeUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const listCertificateTypesUseCase = getListCertificateTypesUseCase();
    const certificateTypes = await listCertificateTypesUseCase.execute(activeOnly);

    return NextResponse.json({
      success: true,
      data: certificateTypes,
    });
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de certificado' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createCertificateTypeUseCase = getCreateCertificateTypeUseCase();
    const certificateType = await createCertificateTypeUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: certificateType,
    });
  } catch (error) {
    console.error('Error creating certificate type:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear tipo de certificado' },
      { status: 500 }
    );
  }
}
