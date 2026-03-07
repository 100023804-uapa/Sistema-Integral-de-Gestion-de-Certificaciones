import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getUpdateTemplateUseCase, getDeleteTemplateUseCase, getListTemplatesUseCase } from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const listTemplatesUseCase = getListTemplatesUseCase();
    const template = await listTemplatesUseCase.findById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching certificate template:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantilla de certificado' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const updateTemplateUseCase = getUpdateTemplateUseCase();
    const template = await updateTemplateUseCase.execute(id, body);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar plantilla de certificado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const deleteTemplateUseCase = getDeleteTemplateUseCase();
    await deleteTemplateUseCase.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar plantilla de certificado' },
      { status: 500 }
    );
  }
}
