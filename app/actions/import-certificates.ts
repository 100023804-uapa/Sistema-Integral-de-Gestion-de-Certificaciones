'use server';

import { getCertificateRepository, getStudentRepository } from '@/lib/container';
import { CreateCertificateDTO } from '@/lib/domain/entities/Certificate';
import { CreateStudentDTO } from '@/lib/domain/entities/Student';

const certificateRepo = getCertificateRepository();
const studentRepo = getStudentRepository();

export type ImportResult = {
    total: number;
    success: number;
    errors: number;
    skipped: number;
    details: { type: 'error' | 'success' | 'info'; message: string }[];
};

export async function importCertificatesFromExcel(data: any[]): Promise<ImportResult> {
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const details: { type: 'error' | 'success' | 'info'; message: string }[] = [];

    for (const row of data) {
        try {
            // 1. Validar datos mínimos (Matricula y Nombre son siempre obligatorios)
            if (!row.Matricula || !row.Nombre) {
                throw new Error(`Fila inválida: Faltan datos obligatorios (Matricula o Nombre)`);
            }

            const matricula = String(row.Matricula).trim();

            // 2. Gestión del Estudiante
            let student = await studentRepo.findById(matricula);

            if (!student) {
                // Crear nuevo estudiante
                const newStudent: CreateStudentDTO = {
                    id: matricula,
                    firstName: String(row.Nombre).trim(),
                    lastName: '', // Asumimos nombre completo en 'Nombre'
                    email: row.Email || '', // Opcional
                    career: String(row.Carrera || '').trim(), // Opcional si viene en Excel
                    cedula: row.Cedula ? String(row.Cedula).trim() : undefined,
                };
                student = await studentRepo.create(newStudent);
            } else {
                // Si existe, actualizamos datos faltantes si vienen en el Excel
                const updates: any = {};
                if (row.Cedula && !student.cedula) updates.cedula = String(row.Cedula).trim();
                // if (row.Email && !student.email) updates.email = row.Email;

                if (Object.keys(updates).length > 0) {
                    await studentRepo.update(student.id, updates);
                }
            }

            // 3. Verificación de Certificado Duplicado (Solo si viene Folio)
            if (row.Folio) {
                const existingCert = await certificateRepo.findByFolio(String(row.Folio).trim());
                if (existingCert) {
                    skippedCount++;
                    details.push({ type: 'info', message: `Matrícula ${row.Matricula}: El folio ${row.Folio} ya existe. Omitido.` });
                    continue;
                }

                // 4. Crear Certificado
                // Procesar fecha (Excel serial o string)
                let issueDate = new Date();
                if (typeof row.Fecha === 'number') {
                    // Excel serial date to JS Date
                    issueDate = new Date(Math.round((row.Fecha - 25569) * 86400 * 1000));
                } else if (row.Fecha) {
                    issueDate = new Date(row.Fecha);
                }

                if (isNaN(issueDate.getTime())) {
                    issueDate = new Date(); // Fallback
                    details.push({ type: 'info', message: `Advertencia: Fecha inválida para ${row.Folio}, usando fecha actual.` });
                }

                const certData: CreateCertificateDTO = {
                    folio: String(row.Folio).trim(),
                    studentId: student.id,
                    studentName: student.firstName + (student.lastName ? ' ' + student.lastName : ''),
                    type: (row.Tipo === 'PROFUNDO' ? 'PROFUNDO' : 'CAP'), // Default CAP
                    academicProgram: String(row.Curso || '').trim(),
                    issueDate: issueDate,
                    status: 'active',
                    metadata: {
                        importedAt: new Date().toISOString(),
                        source: 'excel_bulk_import'
                    }
                };

                await certificateRepo.create(certData);
                successCount++;
            } else {
                // Si no hay folio, solo contamos como éxito la actualización/creación del estudiante
                successCount++;
            }

        } catch (error: any) {
            errorCount++;
            details.push({ type: 'error', message: `Error en Matrícula ${row.Matricula || '?'}: ${error.message}` });
        }
    }

    return {
        total: data.length,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount,
        details
    };
}
