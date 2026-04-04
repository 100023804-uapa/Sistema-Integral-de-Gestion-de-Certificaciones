export type StudentPortalAccountStatus = 'inactive' | 'invited' | 'active' | 'disabled';

export interface StudentPortalAccess {
  enabled: boolean;
  authUid?: string;
  status: StudentPortalAccountStatus;
  mustChangePassword: boolean;
  temporaryPasswordIssuedAt?: Date | null;
  temporaryPasswordIssuedBy?: string | null;
  lastTemporaryResetAt?: Date | null;
  lastTemporaryResetBy?: string | null;
  activatedAt?: Date | null;
  lastLoginAt?: Date | null;
  lastPasswordChangeAt?: Date | null;
}

export interface Student {
  id: string; // Matrícula o Cédula (Identificador único)
  firstName: string;
  lastName: string;
  email: string;
  cedula?: string;
  phone?: string;
  career?: string; // Carrera o Departamento
  programId?: string;
  programNameSnapshot?: string;
  campusId?: string;
  campusNameSnapshot?: string;
  academicAreaId?: string;
  academicAreaNameSnapshot?: string;
  portalAccess?: StudentPortalAccess;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateStudentDTO = Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id: string };
