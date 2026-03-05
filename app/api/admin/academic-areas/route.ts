import { NextRequest, NextResponse } from 'next/server';
import { getListAcademicAreasUseCase, getCreateAcademicAreaUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const campusId = searchParams.get('campusId') || undefined;
    
    const listAcademicAreasUseCase = getListAcademicAreasUseCase();
    const academicAreas = await listAcademicAreasUseCase.execute(activeOnly, campusId);

    return NextResponse.json({ 
      success: true, 
      data: academicAreas 
    });

  } catch (error) {
    console.error('Error fetching academic areas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener áreas académicas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const createAcademicAreaUseCase = getCreateAcademicAreaUseCase();
    const academicArea = await createAcademicAreaUseCase.execute(body);

    return NextResponse.json({ 
      success: true, 
      data: academicArea 
    });

  } catch (error) {
    console.error('Error creating academic area:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear área académica' },
      { status: 500 }
    );
  }
}
