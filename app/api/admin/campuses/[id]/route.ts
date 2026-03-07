import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getUpdateCampusUseCase, getDeleteCampusUseCase, getCampusRepository } from '@/lib/container';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;
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
      data: campus,
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;
    const body = await request.json();
    const updateCampusUseCase = getUpdateCampusUseCase();
    const campus = await updateCampusUseCase.execute(id, body);

    return NextResponse.json({
      success: true,
      data: campus,
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;
    const deleteCampusUseCase = getDeleteCampusUseCase();
    await deleteCampusUseCase.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Recinto eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting campus:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar recinto' },
      { status: 500 }
    );
  }
}
