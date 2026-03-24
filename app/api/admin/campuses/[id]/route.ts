import { NextRequest, NextResponse } from 'next/server';
import { getUpdateCampusUseCase, getDeleteCampusUseCase, getCampusRepository } from '@/lib/container';
import { requireInternalUserRole } from '@/lib/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const campusRepository = getCampusRepository();
    const campus = await campusRepository.findById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const body = await request.json();
    const updateCampusUseCase = getUpdateCampusUseCase();
    const campus = await updateCampusUseCase.execute(id, body);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }
    const { id } = await params;

    const deleteCampusUseCase = getDeleteCampusUseCase();
    await deleteCampusUseCase.execute(id);

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
