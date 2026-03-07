import { NextRequest, NextResponse } from 'next/server';
import { getAcademicAreaRepository, getCampusRepository, getUpdateAcademicAreaUseCase, getDeleteAcademicAreaUseCase } from '@/lib/container';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const repository = getAcademicAreaRepository();
    const area = await repository.findById(id);

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Área académica no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: area });
  } catch (error) {
    console.error('Error fetching academic area:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener área académica' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const updateUseCase = getUpdateAcademicAreaUseCase();
    const area = await updateUseCase.execute(id, body);

    return NextResponse.json({ success: true, data: area });
  } catch (error) {
    console.error('Error updating academic area:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar área académica' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const deleteUseCase = getDeleteAcademicAreaUseCase();
    await deleteUseCase.execute(id);

    return NextResponse.json({ success: true, message: 'Área académica eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting academic area:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar área académica' },
      { status: 500 }
    );
  }
}

