export interface AcademicArea {
  id: string;
  name: string;
  code: string;
  description?: string;
  campusId: string; // Relación con recinto
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAcademicAreaRequest {
  name: string;
  code: string;
  description?: string;
  campusId: string; // Obligatorio
}

export interface UpdateAcademicAreaRequest {
  name?: string;
  code?: string;
  description?: string;
  campusId?: string;
  isActive?: boolean;
}
