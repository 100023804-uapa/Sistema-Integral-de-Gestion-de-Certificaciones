'use server';

import { getCertificateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';

// DTO for the frontend
export interface CertificateSummary {
    id: string;
    folio: string;
    studentName: string;
    courseName: string;
    issueDate: string; // ISO String
    status: 'valid' | 'revoked' | 'expired';
}

export type ConsultationResult =
    | { success: true; data: CertificateSummary[] }
    | { success: false; error: string };

export async function consultCertificates(query: string): Promise<ConsultationResult> {
    if (!query || query.trim().length < 3) {
        return { success: false, error: 'Por favor ingrese un término de búsqueda válido (mínimo 3 caracteres).' };
    }

    const searchTerm = query.trim();
    const repository = getCertificateRepository();

    try {
        const results: Certificate[] = [];

        // 1. Try finding by Folio (Exact match usually)
        // Folios might be case sensitive or not. Let's try exact first.
        const byFolio = await repository.findByFolio(searchTerm);
        if (byFolio) {
            results.push(byFolio);
        } else {
            // 2. If not found by Folio, try by Student ID (Matricula)
            // Matriculas are usually alphanumeric.
            const byStudent = await repository.findByStudentId(searchTerm);
            if (byStudent && byStudent.length > 0) {
                results.push(...byStudent);
            }
        }

        if (results.length === 0) {
            return { success: false, error: 'No se encontraron certificados con los datos proporcionados.' };
        }

        // Map to DTO
        const summaries: CertificateSummary[] = results.map(cert => ({
            id: cert.id!,
            folio: cert.folio,
            studentName: cert.studentName,
            courseName: cert.academicProgram, // Fixed
            issueDate: cert.issueDate.toISOString(),
            status: cert.status === 'active' ? 'valid' : 'revoked', // Mapping 'active' to 'valid' for UI
        }));

        return { success: true, data: summaries };

    } catch (error: any) {
        console.error('Error consulting certificates:', error);
        return { success: false, error: 'Ocurrió un error al consultar los datos. Por favor intente más tarde.' };
    }
}
