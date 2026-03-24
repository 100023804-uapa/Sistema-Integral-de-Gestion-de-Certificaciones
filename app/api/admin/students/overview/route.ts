import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { listStudentOverview } from '@/lib/server/studentOverview';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '20');

    const overview = await listStudentOverview({
      query,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    });

    return NextResponse.json({
      success: true,
      ...overview,
    });
  } catch (error) {
    console.error('Error loading student overview:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible cargar el resumen de participantes.' },
      { status: 500 }
    );
  }
}
