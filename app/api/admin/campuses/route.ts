import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListCampusesUseCase, getCreateCampusUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const listCampusesUseCase = getListCampusesUseCase();
    const campuses = await listCampusesUseCase.execute(activeOnly);

    return NextResponse.json({
      success: true,
      data: campuses,
    });
  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener recintos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const listCampusesUseCase = getListCampusesUseCase();
    const existingCampuses = await listCampusesUseCase.execute();

    const codeExists = existingCampuses.some(
      (campus) => campus.code.toLowerCase() === body.code.toLowerCase()
    );

    if (codeExists) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un recinto con ese codigo' },
        { status: 400 }
      );
    }

    const createCampusUseCase = getCreateCampusUseCase();
    const campus = await createCampusUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: campus,
    });
  } catch (error) {
    console.error('Error creating campus:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear recinto' },
      { status: 500 }
    );
  }
}
