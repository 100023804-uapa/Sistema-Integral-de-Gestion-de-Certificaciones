import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import {
  getListAcademicProgramsUseCase,
  getCreateAcademicProgramUseCase,
  getUpdateAcademicProgramUseCase,
  getDeleteAcademicProgramUseCase,
} from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    const listUseCase = getListAcademicProgramsUseCase();
    const programs = await listUseCase.execute(onlyActive);

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error('Error fetching academic programs:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener programas academicos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createUseCase = getCreateAcademicProgramUseCase();
    const program = await createUseCase.execute({
      name: body.name,
      code: body.code,
      description: body.description,
      durationHours: body.durationHours,
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error('Error creating academic program:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear programa' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID del programa' }, { status: 400 });
    }

    const updateUseCase = getUpdateAcademicProgramUseCase();
    const program = await updateUseCase.execute(id, data);

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error('Error updating academic program:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar programa' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID del programa' }, { status: 400 });
    }

    const deleteUseCase = getDeleteAcademicProgramUseCase();
    await deleteUseCase.execute(id);

    return NextResponse.json({ success: true, message: 'Programa eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting academic program:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar programa' },
      { status: 400 }
    );
  }
}
