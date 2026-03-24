export interface AcademicProgram {
    id: string;
    name: string;
    code: string;
    description?: string;
    durationHours?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAcademicProgramRequest {
    name: string;
    code: string;
    description?: string;
    durationHours?: number;
}

export interface UpdateAcademicProgramRequest {
    name?: string;
    code?: string;
    description?: string;
    durationHours?: number;
    isActive?: boolean;
}
