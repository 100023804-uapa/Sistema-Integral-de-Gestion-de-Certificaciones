import { NextRequest, NextResponse } from 'next/server';
import { getUpdateCampusUseCase, getDeleteCampusUseCase, getCampusRepository } from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campusRepository = getCampusRepository();
    const campus = await campusRepository.findById(params.id);

    if (!campus) {
      return NextResponse.json(
        { success: false, error: 'Recinto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: campus 
    });

  } catch (error) {
    console.error('Error fetching campus:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener recinto' },
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
    const updateCampusUseCase = getUpdateCampusUseCase();
    const campus = await updateCampusUseCase.execute(params.id, body);

    return NextResponse.json({ 
      success: true, 
      data: campus 
    });

  } catch (error) {
    console.error('Error updating campus:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar recinto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleteCampusUseCase = getDeleteCampusUseCase();
    await deleteCampusUseCase.execute(params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Recinto eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error deleting campus:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar recinto' },
      { status: 500 }
    );
  }
}
