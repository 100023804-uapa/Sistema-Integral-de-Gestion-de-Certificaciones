import { NextRequest, NextResponse } from 'next/server';
import { getUpdateRoleUseCase, getDeleteRoleUseCase, getRoleRepository } from '@/lib/container';
import { requireInternalUserRole } from '@/lib/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }

    const roleRepository = getRoleRepository();
    const role = await roleRepository.findById(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();
    const updateRoleUseCase = getUpdateRoleUseCase();
    const role = await updateRoleUseCase.execute(params.id, body);

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
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator']);
    if (auth.response) {
      return auth.response;
    }

    const deleteRoleUseCase = getDeleteRoleUseCase();
    await deleteRoleUseCase.execute(params.id);

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
