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
  id: string; // Matrícula institucional (identificador único del participante)
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string; // URL alojada en UploadThing para el perfil
  cedula?: string; // Documento de identidad opcional (cédula o pasaporte)
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
