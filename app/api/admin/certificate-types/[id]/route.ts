import { NextRequest, NextResponse } from 'next/server';
import { getUpdateCertificateTypeUseCase, getDeleteCertificateTypeUseCase, getCertificateTypeRepository } from '@/lib/container';
import { requireInternalUserRole } from '@/lib/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const certificateTypeRepository = getCertificateTypeRepository();
    const certificateType = await certificateTypeRepository.findById(id);

    if (!certificateType) {
      return NextResponse.json(
        { success: false, error: 'Tipo de certificado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: certificateType 
    });

  } catch (error) {
    console.error('Error fetching certificate type:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipo de certificado' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const body = await request.json();
    const updateCertificateTypeUseCase = getUpdateCertificateTypeUseCase();
    const certificateType = await updateCertificateTypeUseCase.execute(id, body);

    return NextResponse.json({ 
      success: true, 
      data: certificateType 
    });

  } catch (error) {
    console.error('Error updating certificate type:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar tipo de certificado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const deleteCertificateTypeUseCase = getDeleteCertificateTypeUseCase();
    await deleteCertificateTypeUseCase.execute(id);

    return NextResponse.json({ 
      success: true, 
      message: 'Tipo de certificado eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error deleting certificate type:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar tipo de certificado' },
      { status: 500 }
    );
  }
}
