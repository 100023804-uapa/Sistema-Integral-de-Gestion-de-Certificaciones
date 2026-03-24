export interface Signer {
    id: string;
    name: string;
    title: string;
    department?: string;
    signatureUrl?: string; // URL en Firebase Storage
    allowedEmails?: string[]; // Usuarios autorizados para firmar por esta autoridad
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSignerRequest {
    name: string;
    title: string;
    department?: string;
    signatureUrl?: string;
    allowedEmails?: string[];
}

export interface UpdateSignerRequest {
    name?: string;
    title?: string;
    department?: string;
    signatureUrl?: string;
    isActive?: boolean;
    allowedEmails?: string[];
}
