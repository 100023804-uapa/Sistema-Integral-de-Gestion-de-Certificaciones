export interface Signer {
    id: string;
    name: string;
    title: string;
    department?: string;
    signatureUrl?: string; // URL en Firebase Storage
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSignerRequest {
    name: string;
    title: string;
    department?: string;
    signatureUrl?: string;
}

export interface UpdateSignerRequest {
    name?: string;
    title?: string;
    department?: string;
    signatureUrl?: string;
    isActive?: boolean;
}
