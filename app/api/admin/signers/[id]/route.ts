import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getUpdateSignerUseCase, getDeleteSignerUseCase } from '@/lib/container';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const body = await request.json();

    const updateSignerUseCase = getUpdateSignerUseCase();
    const updatedSigner = await updateSignerUseCase.execute(id, body);

    return NextResponse.json({
      success: true,
      data: updatedSigner,
    });
  } catch (error) {
    console.error('Error updating signer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al actualizar firmante' },
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

    const deleteSignerUseCase = getDeleteSignerUseCase();
    await deleteSignerUseCase.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Firmante dado de baja exitosamente',
    });
  } catch (error) {
    console.error('Error deleting signer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al eliminar firmante' },
      { status: 500 }
    );
  }
}
