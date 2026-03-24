'use server';

import { findPublicCertificateValidation } from '@/lib/server/studentPortal';

export interface CertificateSummary {
    id: string;
    folio: string;
    verificationCode?: string;
    issueDate: string;
    status: string;
    statusLabel: string;
    isValid: boolean;
    message: string;
}

export type ConsultationResult =
    | { success: true; data: CertificateSummary[] }
    | { success: false; error: string };

export async function consultCertificates(query: string): Promise<ConsultationResult> {
    if (!query || query.trim().length < 4) {
        return {
            success: false,
            error: 'Ingrese un folio o código de verificación válido.',
        };
    }

    try {
        const certificate = await findPublicCertificateValidation(query.trim());

        if (!certificate) {
            return {
                success: false,
                error: 'No se encontró un certificado con el folio o código indicado.',
            };
        }

        return {
            success: true,
            data: [certificate],
        };
    } catch (error) {
        console.error('Error consulting certificates:', error);
        return {
            success: false,
            error: 'Ocurrió un error al consultar los datos. Intente nuevamente más tarde.',
        };
    }
}
