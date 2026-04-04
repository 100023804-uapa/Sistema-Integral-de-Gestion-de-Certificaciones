import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import {
  getCertificateRepository,
  getUpdateDraftCertificateUseCase,
} from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, [
      'administrator',
      'coordinator',
    ]);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const certificate = await getCertificateRepository().findById(
      decodeURIComponent(id)
    );

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al obtener el certificado',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, [
      'administrator',
      'coordinator',
    ]);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const body = await request.json();

    const useCase = getUpdateDraftCertificateUseCase();
    const certificate = await useCase.execute({
      certificateId: decodeURIComponent(id),
      studentId: String(body.studentId || '').trim(),
      programId: String(body.programId || '').trim(),
      templateId: String(body.templateId || '').trim(),
      campusId: String(body.campusId || '').trim(),
      issueDate: new Date(body.issueDate),
      expirationDate: body.expirationDate
        ? new Date(body.expirationDate)
        : undefined,
      signer1Id: String(body.signer1Id || '').trim(),
      signer2Id: String(body.signer2Id || '').trim() || undefined,
      updatedBy: auth.user.uid,
    });

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error updating draft certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar el borrador',
      },
      { status: 500 }
    );
  }
}
