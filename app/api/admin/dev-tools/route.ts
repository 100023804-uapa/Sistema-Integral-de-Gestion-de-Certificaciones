import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, deleteDoc, doc, addDoc, writeBatch, query, limit
} from 'firebase/firestore';

// ── Solo disponible en desarrollo ──────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';

// ─── Helper: eliminar todos los docs de una colección en lotes ────────────
async function clearCollection(collectionName: string): Promise<number> {
    let deleted = 0;
    let hasMore = true;

    while (hasMore) {
        const q = query(collection(db, collectionName), limit(400));
        const snap = await getDocs(q);
        if (snap.empty) { hasMore = false; break; }

        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
    }
    return deleted;
}

// ─── GET: devuelve estado de colecciones ─────────────────────────────────
export async function GET() {
    if (!isDev) return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 });

    const counts: Record<string, number> = {};
    const collections = [
        'certificates', 'certificateStates', 'stateHistories', 'certificateTypes',
        'digitalSignatures', 'signatureRequests', 'signatureTemplates',
        'students', 'campuses', 'academicAreas', 'academicPrograms',
        'certificateTemplates', 'generatedCertificates', 'templates',
        'roles', 'userRoles', 'system_config', 'access_requests', 'access_users'
    ];

    await Promise.all(collections.map(async (col) => {
        const snap = await getDocs(collection(db, col));
        counts[col] = snap.size;
    }));

    return NextResponse.json({ success: true, counts });
}

// ─── POST: ejecutar acción (clear o seed) ────────────────────────────────
export async function POST(request: NextRequest) {
    if (!isDev) return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 });

    const body = await request.json();
    const { action, collectionsToClear } = body;

    // ── CLEAR: borra colecciones seleccionadas ─────────────────────────
    if (action === 'clear') {
        if (!collectionsToClear || !Array.isArray(collectionsToClear) || collectionsToClear.length === 0) {
            return NextResponse.json({ error: 'No se especificaron colecciones para limpiar' }, { status: 400 });
        }

        const details: Record<string, number> = {};

        await Promise.all(collectionsToClear.map(async (colName: string) => {
            const deleted = await clearCollection(colName);
            details[colName] = deleted;
        }));

        return NextResponse.json({
            success: true,
            message: `Limpieza completada en ${collectionsToClear.length} colecciones`,
            details
        });
    }

    // ── SEED: inserta datos de ejemplo alineados con la estructura actual ──
    if (action === 'seed') {
        // Obtener catálogos reales para usar IDs existentes
        const [campusSnap, areaSnap, programSnap, typeSnap] = await Promise.all([
            getDocs(collection(db, 'campuses')),
            getDocs(collection(db, 'academicAreas')),
            getDocs(collection(db, 'academicPrograms')),
            getDocs(collection(db, 'certificateTypes')),
        ]);

        const campuses = campusSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const areas = areaSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const programs = programSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const types = typeSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        if (campuses.length === 0) {
            return NextResponse.json({ success: false, error: 'No hay recintos registrados. Crea al menos uno antes de sembrar datos.' }, { status: 400 });
        }

        const campus = campuses[0];
        const area = areas[0] || null;
        const program = programs[0] || null;
        const certType = types[0] || null;

        // Datos de ejemplo de estudiantes
        const sampleStudents = [
            { name: 'María García López', studentId: '2024-00101', cedula: '402-1010101-1' },
            { name: 'Carlos Rodríguez Pérez', studentId: '2024-00102', cedula: '402-2020202-2' },
            { name: 'Ana Martínez Soto', studentId: '2024-00103', cedula: '402-3030303-3' },
            { name: 'Luis Hernández Díaz', studentId: '2024-00104', cedula: '402-4040404-4' },
            { name: 'Rosa Jiménez Cruz', studentId: '2024-00105', cedula: '402-5050505-5' },
        ];

        const now = new Date();
        const seeded: string[] = [];

        for (let i = 0; i < sampleStudents.length; i++) {
            const student = sampleStudents[i];
            const year = now.getFullYear();
            const folio = `SIGCE-${year}-CAP-${String(i + 1).padStart(4, '0')}`;

            // 1. Crear certificado
            const certRef = await addDoc(collection(db, 'certificates'), {
                folio,
                studentName: student.name,
                studentId: student.studentId,
                cedula: student.cedula,
                academicProgram: program?.name || 'Gestión de Proyectos',
                type: certType?.code || 'CAP',
                status: 'active',
                campusId: campus.id,
                campusName: campus.name || campus.code,
                areaId: area?.id || null,
                areaName: area?.name || null,
                programId: program?.id || null,
                issueDate: now,
                createdAt: now,
                updatedAt: now,
                isVerified: true,
            });

            seeded.push(certRef.id);

            // 2. Crear estado inicial del certificado
            await addDoc(collection(db, 'certificateStates'), {
                certificateId: certRef.id,
                studentId: student.studentId,
                currentState: 'active',
                changedBy: 'system_seed',
                changedAt: now,
                notes: 'Creado por seeder de desarrollo',
            });
        }

        return NextResponse.json({
            success: true,
            message: `${seeded.length} certificados de ejemplo creados correctamente`,
            details: {
                campus: campus.name || campus.code,
                program: program?.name || '(sin programa)',
                certIds: seeded,
            }
        });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}
