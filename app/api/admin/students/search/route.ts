import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getStudentRepository } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const queryStr = searchParams.get('q')?.toLowerCase() || '';

    if (!queryStr || queryStr.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const studentRepository = getStudentRepository();
    const allStudents = await studentRepository.list(200);

    const filtered = allStudents.filter(
      (student) =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(queryStr) ||
        student.cedula?.includes(queryStr) ||
        student.id?.includes(queryStr)
    );

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, 10),
    });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar estudiantes' },
      { status: 500 }
    );
  }
}
