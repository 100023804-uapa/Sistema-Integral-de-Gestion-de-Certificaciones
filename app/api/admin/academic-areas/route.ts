import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListAcademicAreasUseCase, getCreateAcademicAreaUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const campusId = searchParams.get('campusId') || undefined;

    const listAcademicAreasUseCase = getListAcademicAreasUseCase();
    const academicAreas = await listAcademicAreasUseCase.execute(activeOnly, campusId);

    return NextResponse.json({
      success: true,
      data: academicAreas,
    });
  } catch (error) {
    console.error('Error fetching academic areas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener areas academicas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createAcademicAreaUseCase = getCreateAcademicAreaUseCase();
    const academicArea = await createAcademicAreaUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: academicArea,
    });
  } catch (error) {
    console.error('Error creating academic area:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear area academica' },
      { status: 500 }
    );
  }
}
