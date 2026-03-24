import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-session';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, deleteDoc, doc, addDoc, writeBatch, query, limit, setDoc
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
export async function GET(request: NextRequest) {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

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
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    if (!isDev) return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 });

    const body = await request.json();
    const { action, collectionsToClear, collectionsToSeed } = body;

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

    // ── SEED: inserta datos de ejemplo seleccionados ───────────────────
    if (action === 'seed') {
        if (!collectionsToSeed || !Array.isArray(collectionsToSeed) || collectionsToSeed.length === 0) {
            return NextResponse.json({ error: 'No se especificaron colecciones para sembrar' }, { status: 400 });
        }

        const now = new Date();
        const details: Record<string, any> = {};

        // Datos de ejemplo de estudiantes compartidos
        const sampleStudents = [
            { name: 'María García López', studentId: '2024-00101', cedula: '402-1010101-1' },
            { name: 'Carlos Rodríguez Pérez', studentId: '2024-00102', cedula: '402-2020202-2' },
            { name: 'Ana Martínez Soto', studentId: '2024-00103', cedula: '402-3030303-3' },
            { name: 'Luis Hernández Díaz', studentId: '2024-00104', cedula: '402-4040404-4' },
            { name: 'Rosa Jiménez Cruz', studentId: '2024-00105', cedula: '402-5050505-5' },
        ];

        // 1. --- SEED Catálogos ---
        if (collectionsToSeed.includes('academicAreas')) {
            const docRef = await addDoc(collection(db, 'academicAreas'), { code: 'NEG', name: 'Negocios', active: true, createdAt: now });
            details.academicAreas = 1;
        }
        if (collectionsToSeed.includes('campuses')) {
            const docRef = await addDoc(collection(db, 'campuses'), { code: 'SDQ', name: 'Recinto Santo Domingo', active: true, createdAt: now });
            details.campuses = 1;
        }
        if (collectionsToSeed.includes('academicPrograms')) {
            const docRef = await addDoc(collection(db, 'academicPrograms'), { code: 'GP', name: 'Gestión de Proyectos', active: true, createdAt: now });
            details.academicPrograms = 1;
        }
        if (collectionsToSeed.includes('certificateTypes')) {
            const docRef = await addDoc(collection(db, 'certificateTypes'), { code: 'CAP', name: 'Capacitación', requireVerification: true, active: true, createdAt: now });
            details.certificateTypes = 1;
        }
        if (collectionsToSeed.includes('roles')) {
            await addDoc(collection(db, 'roles'), { name: 'Super Admin', permissions: ['all'], active: true, createdAt: now });
            await addDoc(collection(db, 'roles'), { name: 'Verificador', permissions: ['verify_certs'], active: true, createdAt: now });
            details.roles = 2;
        }

        // 2. --- SEED Estudiantes ---
        if (collectionsToSeed.includes('students')) {
            for (const student of sampleStudents) {
                await addDoc(collection(db, 'students'), { ...student, active: true, createdAt: now });
            }
            details.students = sampleStudents.length;
        }

        // 3. --- SEED Configuración Sistema ---
        if (collectionsToSeed.includes('system_config')) {
            await setDoc(doc(db, 'system_config', 'core'), {
                appName: 'SIGCE',
                maintenanceMode: false,
                createdAt: now,
                updatedAt: now
            });
            details.system_config = 1;
        }

        // 4. --- SEED Certificados & Estados ---
        if (collectionsToSeed.includes('certificates')) {
            // Obtenemos catálogos reales (existentes o recién creados en el bloque de arriba)
            const [campusSnap, areaSnap, programSnap, typeSnap] = await Promise.all([
                getDocs(collection(db, 'campuses')),
                getDocs(collection(db, 'academicAreas')),
                getDocs(collection(db, 'academicPrograms')),
                getDocs(collection(db, 'certificateTypes')),
            ]);

            const campuses = campusSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

            if (campuses.length === 0) {
                return NextResponse.json({ success: false, error: 'No hay recintos (campuses). Crea o siembra al menos uno antes de sembrar certificados.' }, { status: 400 });
            }

            const campus = campuses[0];
            const area = areaSnap.docs.map(d => ({ id: d.id, ...d.data() as any }))[0] || null;
            const program = programSnap.docs.map(d => ({ id: d.id, ...d.data() as any }))[0] || null;
            const certType = typeSnap.docs.map(d => ({ id: d.id, ...d.data() as any }))[0] || null;

            const seededIds: string[] = [];

            for (let i = 0; i < sampleStudents.length; i++) {
                const student = sampleStudents[i];
                const year = now.getFullYear();
                const folio = `SIGCE-${year}-CAP-${String(i + 1).padStart(4, '0')}`;

                const certRef = await addDoc(collection(db, 'certificates'), {
                    folio,
                    studentName: student.name,
                    studentId: student.studentId,
                    cedula: student.cedula,
                    academicProgram: program?.name || 'Gestión de Proyectos genérico',
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

                seededIds.push(certRef.id);

                // Si también se solicitó sembrar Estados explícitamente, o por conveniencia (ya que un cert 'active' necesita tener su estado)
                if (collectionsToSeed.includes('certificateStates') || collectionsToSeed.includes('certificates')) {
                    await addDoc(collection(db, 'certificateStates'), {
                        certificateId: certRef.id,
                        studentId: student.studentId,
                        currentState: 'active',
                        changedBy: 'system_seed',
                        changedAt: now,
                        notes: 'Creado por seeder de desarrollo',
                    });
                }
            }

            details.certificates = seededIds.length;
            if (collectionsToSeed.includes('certificateStates')) {
                details.certificateStates = seededIds.length;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Siembra completada para las colecciones seleccionadas`,
            details
        });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}
