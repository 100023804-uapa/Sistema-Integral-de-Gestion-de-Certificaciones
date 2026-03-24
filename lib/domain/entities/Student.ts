export type StudentPortalAccountStatus = 'inactive' | 'invited' | 'active' | 'disabled';

export interface StudentPortalAccess {
  enabled: boolean;
  authUid?: string;
  status: StudentPortalAccountStatus;
  mustChangePassword: boolean;
  temporaryPasswordIssuedAt?: Date;
  temporaryPasswordIssuedBy?: string;
  lastTemporaryResetAt?: Date;
  lastTemporaryResetBy?: string;
  activatedAt?: Date;
  lastLoginAt?: Date;
  lastPasswordChangeAt?: Date;
}

export interface Student {
  id: string; // Matrícula o Cédula (Identificador único)
  firstName: string;
  lastName: string;
  email: string;
  cedula?: string;
  phone?: string;
  career?: string; // Carrera o Departamento
  portalAccess?: StudentPortalAccess;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateStudentDTO = Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id: string };
