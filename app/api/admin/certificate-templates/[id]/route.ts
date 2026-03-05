import { NextRequest, NextResponse } from 'next/server';
import { getUpdateTemplateUseCase, getDeleteTemplateUseCase, getListTemplatesUseCase } from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listTemplatesUseCase = getListTemplatesUseCase();
    const template = await listTemplatesUseCase.findById(params.id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: template 
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateTemplateUseCase = getUpdateTemplateUseCase();
    const template = await updateTemplateUseCase.execute(params.id, body);

    return NextResponse.json({ 
      success: true, 
      data: template 
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
  { params }: { params: { id: string } }
) {
  try {
    const deleteTemplateUseCase = getDeleteTemplateUseCase();
    await deleteTemplateUseCase.execute(params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Plantilla eliminada correctamente' 
    });

  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar plantilla de certificado' },
      { status: 500 }
    );
  }
}
