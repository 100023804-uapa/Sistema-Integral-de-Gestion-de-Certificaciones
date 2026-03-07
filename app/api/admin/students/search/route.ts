import { NextRequest, NextResponse } from 'next/server';
import { getStudentRepository } from '@/lib/container';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const queryStr = searchParams.get('q')?.toLowerCase() || '';

        if (!queryStr || queryStr.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Instanciar repositorio
        const studentRepository = getStudentRepository();
        // En una DB real con full-text search se haría allí. 
        // Para Firebase básico obtenemos un límite generoso y filtramos en memoria por simplicidad MVP.
        // getStudentRepository().list() por defecto trae 50. Si necesitamos más, podríamos aumentar el límite.
        const allStudents = await studentRepository.list(200);

        const filtered = allStudents.filter(student =>
            (student.firstName + ' ' + student.lastName).toLowerCase().includes(queryStr) ||
            student.cedula?.includes(queryStr) ||
            student.id?.includes(queryStr) // ID = Matrícula normalmente
        );

        // Devolvemos máximo 10 resultados para no saturar el dropdown
        return NextResponse.json({
            success: true,
            data: filtered.slice(0, 10)
        });

    } catch (error) {
        console.error('Error searching students:', error);
        return NextResponse.json(
            { success: false, error: 'Error al buscar estudiantes' },
            { status: 500 }
        );
    }
}
