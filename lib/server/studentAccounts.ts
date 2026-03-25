import crypto from 'node:crypto';
import type { UserRecord } from 'firebase-admin/auth';
import {
  Student,
  StudentPortalAccess,
} from '@/lib/domain/entities/Student';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { SIGCE_INTERNAL_CLAIM } from '@/lib/auth/claims';
import { createNotificationFanout } from '@/lib/server/notifications';

const STUDENTS_COLLECTION = 'students';
const ACCESS_USERS_COLLECTION = 'access_users';
const INTERNAL_USERS_COLLECTION = 'internal_users';

type TemporaryPasswordMode = 'activate' | 'reset';

export interface StudentTemporaryPasswordResult {
  student: Student;
  temporaryPassword: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildDisplayName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim() || student.id;
}

function mapPortalAccess(value: unknown): StudentPortalAccess | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = value as Record<string, unknown>;

  return {
    enabled: source.enabled === true,
    authUid: typeof source.authUid === 'string' ? source.authUid : undefined,
    status:
      source.status === 'invited' ||
      source.status === 'active' ||
      source.status === 'disabled'
        ? source.status
        : 'inactive',
    mustChangePassword: source.mustChangePassword === true,
    temporaryPasswordIssuedAt: toDate(source.temporaryPasswordIssuedAt),
    temporaryPasswordIssuedBy:
      typeof source.temporaryPasswordIssuedBy === 'string'
        ? source.temporaryPasswordIssuedBy
        : undefined,
    lastTemporaryResetAt: toDate(source.lastTemporaryResetAt),
    lastTemporaryResetBy:
      typeof source.lastTemporaryResetBy === 'string'
        ? source.lastTemporaryResetBy
        : undefined,
    activatedAt: toDate(source.activatedAt),
    lastLoginAt: toDate(source.lastLoginAt),
    lastPasswordChangeAt: toDate(source.lastPasswordChangeAt),
  };
}

function mapStudentSnapshot(
  id: string,
  data: Record<string, unknown> | undefined
): Student {
  const source = data ?? {};

  return {
    id,
    firstName: typeof source.firstName === 'string' ? source.firstName : '',
    lastName: typeof source.lastName === 'string' ? source.lastName : '',
    email: typeof source.email === 'string' ? normalizeEmail(source.email) : '',
    cedula: typeof source.cedula === 'string' ? source.cedula : undefined,
    phone: typeof source.phone === 'string' ? source.phone : undefined,
    career: typeof source.career === 'string' ? source.career : undefined,
    portalAccess: mapPortalAccess(source.portalAccess),
    createdAt: toDate(source.createdAt) ?? new Date(),
    updatedAt: toDate(source.updatedAt) ?? new Date(),
  };
}

function generateTemporaryPassword() {
  const random = crypto.randomBytes(6).toString('base64url');
  return `Sigce!${random}9a`;
}

async function getStudentDocument(studentId: string) {
  return getAdminDb().collection(STUDENTS_COLLECTION).doc(studentId).get();
}

async function getStudentById(studentId: string): Promise<Student> {
  const snapshot = await getStudentDocument(studentId);
  if (!snapshot.exists) {
    throw new Error('Participante no encontrado');
  }

  return mapStudentSnapshot(snapshot.id, snapshot.data() as Record<string, unknown>);
}

async function isInternalEmail(email: string): Promise<boolean> {
  if (!email.trim()) {
    return false;
  }

  const accessUser = await getAdminDb()
    .collection(ACCESS_USERS_COLLECTION)
    .doc(normalizeEmail(email))
    .get();

  return accessUser.exists && accessUser.data()?.disabled !== true;
}

async function assertUserIsNotInternal(email: string, authUser?: UserRecord | null) {
  if (await isInternalEmail(email)) {
    throw new Error('El correo pertenece a una cuenta interna del sistema');
  }

  if (!authUser) return;

  if (authUser.customClaims?.[SIGCE_INTERNAL_CLAIM] === true) {
    throw new Error('La cuenta ya está asociada a un usuario interno');
  }

  const internalUserDoc = await getAdminDb()
    .collection(INTERNAL_USERS_COLLECTION)
    .doc(authUser.uid)
    .get();

  if (internalUserDoc.exists) {
    throw new Error('La cuenta ya está asociada a un usuario interno');
  }
}

async function resolveStudentAuthUser(student: Student): Promise<UserRecord | null> {
  const auth = getAdminAuth();
  const normalizedEmail = normalizeEmail(student.email);

  if (student.portalAccess?.authUid) {
    try {
      const byUid = await auth.getUser(student.portalAccess.authUid);
      await assertUserIsNotInternal(normalizedEmail, byUid);

      if (normalizedEmail && normalizeEmail(byUid.email || '') !== normalizedEmail) {
        return auth.updateUser(byUid.uid, { email: normalizedEmail });
      }

      return byUid;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'auth/user-not-found') {
        throw error;
      }
    }
  }

  if (!normalizedEmail) {
    return null;
  }

  try {
    const byEmail = await auth.getUserByEmail(normalizedEmail);
    await assertUserIsNotInternal(normalizedEmail, byEmail);
    return byEmail;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

function buildPortalAccessPayload(
  existing: StudentPortalAccess | undefined,
  actorId: string,
  authUid: string
): StudentPortalAccess {
  const timestamp = new Date();

  return {
    enabled: true,
    authUid,
    status: 'invited',
    mustChangePassword: true,
    temporaryPasswordIssuedAt: timestamp,
    temporaryPasswordIssuedBy: actorId,
    lastTemporaryResetAt: timestamp,
    lastTemporaryResetBy: actorId,
    activatedAt: existing?.activatedAt,
    lastLoginAt: existing?.lastLoginAt,
    lastPasswordChangeAt: existing?.lastPasswordChangeAt,
  };
}

export async function issueStudentTemporaryPassword(
  studentId: string,
  actorId: string,
  mode: TemporaryPasswordMode
): Promise<StudentTemporaryPasswordResult> {
  const student = await getStudentById(studentId);
  const normalizedEmail = normalizeEmail(student.email);

  if (!normalizedEmail) {
    throw new Error('El participante debe tener un correo registrado para habilitar acceso');
  }

  let authUser = await resolveStudentAuthUser(student);
  await assertUserIsNotInternal(normalizedEmail, authUser);

  const auth = getAdminAuth();
  const temporaryPassword = generateTemporaryPassword();
  const displayName = buildDisplayName(student);

  if (authUser) {
    authUser = await auth.updateUser(authUser.uid, {
      email: normalizedEmail,
      displayName,
      password: temporaryPassword,
      disabled: false,
    });
  } else {
    authUser = await auth.createUser({
      email: normalizedEmail,
      displayName,
      password: temporaryPassword,
      disabled: false,
    });
  }

  await auth.revokeRefreshTokens(authUser.uid);

  const nextPortalAccess = buildPortalAccessPayload(
    student.portalAccess,
    actorId,
    authUser.uid
  );

  const timestamp = new Date();
  await getAdminDb()
    .collection(STUDENTS_COLLECTION)
    .doc(studentId)
    .set(
      {
        email: normalizedEmail,
        updatedAt: timestamp,
        portalAccess: nextPortalAccess,
      },
      { merge: true }
    );

  const updatedStudent = await getStudentById(studentId);

  await createNotificationFanout({
    targets: [
      {
        recipientType: 'student',
        recipientId: studentId,
      },
    ],
    type: mode === 'activate' ? 'student.portal_access.activated' : 'student.portal_access.reset',
    category: 'access',
    priority: 'high',
    title:
      mode === 'activate'
        ? 'Tu acceso al portal fue habilitado'
        : 'Tu acceso al portal fue restablecido',
    body:
      mode === 'activate'
        ? 'Al ingresar deberás cambiar tu contraseña temporal.'
        : 'Se generó una nueva contraseña temporal y al ingresar deberás cambiarla.',
    ctaLabel: 'Abrir portal',
    ctaHref: '/login',
    entityType: 'student',
    entityId: studentId,
    actorUid: actorId,
    sourceEvent: {
      key: `student.portal_access.${mode}.${studentId}`,
    },
  });

  return {
    student: updatedStudent,
    temporaryPassword,
  };
}

export async function markStudentPortalLogin(studentId: string): Promise<void> {
  const student = await getStudentById(studentId);

  if (!student.portalAccess?.enabled) {
    return;
  }

  await getAdminDb()
    .collection(STUDENTS_COLLECTION)
    .doc(studentId)
    .set(
      {
        updatedAt: new Date(),
        portalAccess: {
          ...student.portalAccess,
          enabled: true,
          lastLoginAt: new Date(),
        },
      },
      { merge: true }
    );
}

export async function completeStudentPasswordChange(
  studentId: string,
  authUid: string,
  newPassword: string
): Promise<Student> {
  const student = await getStudentById(studentId);

  if (!student.portalAccess?.enabled || student.portalAccess.authUid !== authUid) {
    throw new Error('La cuenta del participante no está habilitada para cambiar contraseña');
  }

  await getAdminAuth().updateUser(authUid, {
    password: newPassword,
    disabled: false,
  });
  await getAdminAuth().revokeRefreshTokens(authUid);

  const timestamp = new Date();
  await getAdminDb()
    .collection(STUDENTS_COLLECTION)
    .doc(studentId)
    .set(
      {
        updatedAt: timestamp,
        portalAccess: {
          ...student.portalAccess,
          enabled: true,
          authUid,
          status: 'active',
          mustChangePassword: false,
          activatedAt: student.portalAccess.activatedAt || timestamp,
          lastPasswordChangeAt: timestamp,
        },
      },
      { merge: true }
    );

  return getStudentById(studentId);
}
