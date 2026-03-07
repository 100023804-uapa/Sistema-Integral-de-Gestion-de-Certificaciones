import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListRolesUseCase, getCreateRoleUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const listRolesUseCase = getListRolesUseCase();
    const roles = await listRolesUseCase.execute(activeOnly);

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createRoleUseCase = getCreateRoleUseCase();
    const role = await createRoleUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear rol' },
      { status: 500 }
    );
  }
}
