import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getStudentRepository } from '@/lib/container';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const params = await context.params;
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json({ error: 'ID de participante no proporcionado' }, { status: 400 });
    }

    const data = await request.json();

    if (data.id && data.id !== studentId) {
      return NextResponse.json(
        { error: 'No se puede modificar la matricula (ID) del participante.' },
        { status: 400 }
      );
    }

    const studentRepo = getStudentRepository();
    const decodedStudentId = decodeURIComponent(studentId);
    const existingStudent = await studentRepo.findById(decodedStudentId);

    if (!existingStudent) {
      return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
    }

    await studentRepo.update(decodedStudentId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      cedula: data.cedula,
      career: data.career,
    });

    return NextResponse.json({ success: true, message: 'Participante actualizado exitosamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al actualizar participante' },
      { status: 500 }
    );
  }
}
