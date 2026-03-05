import { NextRequest, NextResponse } from 'next/server';
import { getUpdateAcademicAreaUseCase, getDeleteAcademicAreaUseCase, getAcademicAreaRepository } from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const academicAreaRepository = getAcademicAreaRepository();
    const academicArea = await academicAreaRepository.findById(params.id);

    if (!academicArea) {
      return NextResponse.json(
        { success: false, error: 'Área académica no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: academicArea 
    });

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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateAcademicAreaUseCase = getUpdateAcademicAreaUseCase();
    const academicArea = await updateAcademicAreaUseCase.execute(params.id, body);

    return NextResponse.json({ 
      success: true, 
      data: academicArea 
    });

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
  { params }: { params: { id: string } }
) {
  try {
    const deleteAcademicAreaUseCase = getDeleteAcademicAreaUseCase();
    await deleteAcademicAreaUseCase.execute(params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Área académica eliminada correctamente' 
    });

  } catch (error) {
    console.error('Error deleting academic area:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar área académica' },
      { status: 500 }
    );
  }
}
