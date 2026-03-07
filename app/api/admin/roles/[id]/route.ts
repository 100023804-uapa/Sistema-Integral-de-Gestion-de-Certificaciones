import { NextRequest, NextResponse } from 'next/server';
import { getUpdateRoleUseCase, getDeleteRoleUseCase, getRoleRepository } from '@/lib/container';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roleRepository = getRoleRepository();
    const role = await roleRepository.findById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: role 
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener rol' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updateRoleUseCase = getUpdateRoleUseCase();
    const role = await updateRoleUseCase.execute(id, body);

    return NextResponse.json({ 
      success: true, 
      data: role 
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar rol' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleteRoleUseCase = getDeleteRoleUseCase();
    await deleteRoleUseCase.execute(id);

    return NextResponse.json({ 
      success: true, 
      message: 'Rol eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar rol' },
      { status: 500 }
    );
  }
}
