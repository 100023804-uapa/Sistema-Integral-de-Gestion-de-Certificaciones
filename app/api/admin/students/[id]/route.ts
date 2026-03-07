import { NextRequest, NextResponse } from 'next/server';
import { getStudentRepository } from '@/lib/container';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Cambio según indicaciones Next.js 15
) {
    try {
        // 1. Verificación de autenticación
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            await getAdminAuth().verifyIdToken(token);
        } catch (error) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Obtener ID del params de forma asíncrona (Next.js 15)
        const params = await context.params;
        const studentId = params.id;

        if (!studentId) {
            return NextResponse.json({ error: 'ID de participante no proporcionado' }, { status: 400 });
        }

        // 2. Extracción y validación de datos
        const data = await request.json();

        // No permitimos actualizar la matrícula ('id') mediante este endpoint
        // porque en Firestore la matrícula es el ID del documento.
        if (data.id && data.id !== studentId) {
            return NextResponse.json({ error: 'No se puede modificar la matrícula (ID) del participante.' }, { status: 400 });
        }

        const studentRepo = getStudentRepository();

        // 3. Verificar si el estudiante existe
        const existingStudent = await studentRepo.findById(decodeURIComponent(studentId));
        if (!existingStudent) {
            return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
        }

        // 4. Actualizar
        await studentRepo.update(decodeURIComponent(studentId), {
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
