import { getEmailProvider } from '@/lib/email/provider';
import { buildInternalUserClaims } from '@/lib/auth/claims';
import { getAdminApp, getAdminAuth } from '@/lib/firebaseAdmin';
import type { UserRecord } from 'firebase-admin/auth';
import type {
  CreateInternalUserInput,
  InternalUser,
  InternalUserStatus,
  UpdateInternalUserInput,
} from '@/lib/types/internalUser';
import type { RoleValue } from '@/lib/types/role';

const COLLECTION_NAME = 'internal_users';
const LEGACY_COLLECTION_NAME = 'access_users';

function getAdminDb() {
  return getAdminApp().firestore();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function now() {
  return new Date();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function mapLegacyRoleCode(role: unknown): RoleValue {
  if (role === 'admin') {
    return 'administrator';
  }

  return ensureRoleCode(typeof role === 'string' ? role : 'coordinator');
}

function buildDisplayName(email: string, preferredName?: string | null) {
  if (preferredName && preferredName.trim()) {
    return preferredName.trim();
  }

  const [localPart] = email.split('@');
  return localPart.replace(/[._-]+/g, ' ').trim() || email;
}

function ensureRoleCode(roleCode: string): RoleValue {
  if (
    roleCode !== 'administrator' &&
    roleCode !== 'coordinator' &&
    roleCode !== 'verifier' &&
    roleCode !== 'signer'
  ) {
    throw new Error('Rol inválido');
  }

  return roleCode;
}

function mapInternalUser(
  id: string,
  data: Record<string, unknown> | undefined
): InternalUser {
  const source = data ?? {};
  const toStringOrEmpty = (value: unknown) =>
    typeof value === 'string' ? value : '';
  const toOptionalString = (value: unknown) =>
    typeof value === 'string' ? value : undefined;
  const toDate = (value: unknown) =>
    value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)
      ? ((value as { toDate: () => Date }).toDate())
      : value instanceof Date
        ? value
        : null;

  return {
    uid: id,
    email: toStringOrEmpty(source.email),
    displayName: toStringOrEmpty(source.displayName),
    roleCode: ensureRoleCode(
      typeof source.roleCode === 'string' ? source.roleCode : 'coordinator'
    ),
    status: (
      source.status === 'active' ||
      source.status === 'disabled' ||
      source.status === 'invited'
        ? source.status
        : 'invited'
    ) as InternalUserStatus,
    createdAt: toDate(source.createdAt),
    updatedAt: toDate(source.updatedAt),
    createdBy: toStringOrEmpty(source.createdBy),
    updatedBy: toOptionalString(source.updatedBy),
    inviteSentAt: toDate(source.inviteSentAt),
    activatedAt: toDate(source.activatedAt),
    lastLoginAt: toDate(source.lastLoginAt),
  };
}

function buildPasswordSetupLink(email: string) {
  const auth = getAdminAuth();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';

  return auth.generatePasswordResetLink(email, {
    url: `${baseUrl}/login`,
  });
}

async function sendInternalInvitationEmail(params: {
  email: string;
  displayName: string;
  roleCode: RoleValue;
  activationLink: string;
}) {
  const provider = getEmailProvider();
  if (!provider) {
    return { success: false, error: 'No hay proveedor de correo configurado' };
  }

  return provider.sendEmail({
    to: params.email,
    subject: 'Acceso interno SIGCE activado',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #003366;">Hola, ${params.displayName}</h2>
        <p>Tu acceso interno a SIGCE fue creado correctamente.</p>
        <p><strong>Rol asignado:</strong> ${params.roleCode}</p>
        <p>Para activar tu cuenta y definir tu contraseña, utiliza el siguiente enlace seguro:</p>
        <p style="margin: 24px 0;">
          <a href="${params.activationLink}" style="background: #003366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">
            Activar acceso
          </a>
        </p>
        <p>Si no solicitaste este acceso, ignora este mensaje.</p>
      </div>
    `,
  });
}

export async function listInternalUsers(): Promise<InternalUser[]> {
  const [internalSnapshot, legacySnapshot] = await Promise.all([
    getAdminDb()
      .collection(COLLECTION_NAME)
      .orderBy('createdAt', 'desc')
      .get(),
    getAdminDb().collection(LEGACY_COLLECTION_NAME).get(),
  ]);

  const users = internalSnapshot.docs.map((doc) => mapInternalUser(doc.id, doc.data()));
  const knownEmails = new Set(users.map((user) => normalizeEmail(user.email)));
  const legacyUsers = await Promise.all(
    legacySnapshot.docs.map(async (doc) => {
      const data = doc.data() as Record<string, unknown>;
      const email = normalizeEmail(
        typeof data.email === 'string' ? data.email : doc.id
      );

      if (!email || knownEmails.has(email)) {
        return null;
      }

      return syncLegacyInternalUser(email, data);
    })
  );

  return [...users, ...legacyUsers.filter((user): user is InternalUser => user !== null)].sort(
    (left, right) =>
      (right.createdAt?.getTime() || 0) - (left.createdAt?.getTime() || 0)
  );
}

export async function getInternalUser(uid: string): Promise<InternalUser | null> {
  const doc = await getAdminDb().collection(COLLECTION_NAME).doc(uid).get();
  if (doc.exists) {
    return mapInternalUser(doc.id, doc.data());
  }

  try {
    const authUser = await getAdminAuth().getUser(uid);
    return syncLegacyInternalUser(normalizeEmail(authUser.email || ''));
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      return null;
    }

    throw error;
  }
}

export async function createInternalUser(
  input: CreateInternalUserInput,
  actorId: string
): Promise<InternalUser> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const roleCode = ensureRoleCode(input.roleCode);

  if (!email) throw new Error('El correo es obligatorio');
  if (!displayName) throw new Error('El nombre es obligatorio');

  const adminAuth = getAdminAuth();
  let authUser: UserRecord | null = null;

  try {
    authUser = await adminAuth.getUserByEmail(email);
    const existingInternalUser = await getInternalUser(authUser.uid);
    if (existingInternalUser) {
      throw new Error('Ya existe un usuario interno con ese correo');
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      authUser = null;
    } else {
      throw error;
    }
  }

  const targetAuthUser = authUser
    ? await adminAuth.updateUser(authUser.uid, {
        displayName,
        disabled: false,
      })
    : await adminAuth.createUser({
        email,
        displayName,
        password: `Sigce#${Math.random().toString(36).slice(2, 10)}A1`,
        disabled: false,
      });

  await adminAuth.setCustomUserClaims(
    targetAuthUser.uid,
    buildInternalUserClaims(roleCode)
  );
  await adminAuth.revokeRefreshTokens(targetAuthUser.uid);

  const activationLink = await buildPasswordSetupLink(email);
  const emailResult = await sendInternalInvitationEmail({
    email,
    displayName,
    roleCode,
    activationLink,
  });

  const timestamp = now();
  await getAdminDb()
    .collection(COLLECTION_NAME)
    .doc(targetAuthUser.uid)
    .set({
      email,
      displayName,
      roleCode,
      status: 'invited',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: actorId,
      updatedBy: actorId,
      inviteSentAt: emailResult.success ? timestamp : null,
    });

  return mapInternalUser(targetAuthUser.uid, {
    email,
    displayName,
    roleCode,
    status: 'invited',
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: actorId,
    updatedBy: actorId,
    inviteSentAt: emailResult.success ? timestamp : null,
  });
}

export async function updateInternalUser(
  uid: string,
  input: UpdateInternalUserInput,
  actorId: string
): Promise<InternalUser> {
  const existing = await getInternalUser(uid);
  if (!existing) {
    throw new Error('Usuario interno no encontrado');
  }

  const adminAuth = getAdminAuth();
  const updateData: Record<string, unknown> = {
    updatedAt: now(),
    updatedBy: actorId,
  };
  let shouldRevokeSessions = false;

  if (input.displayName?.trim()) {
    updateData.displayName = input.displayName.trim();
    await adminAuth.updateUser(uid, { displayName: input.displayName.trim() });
  }

  if (input.roleCode) {
    const roleCode = ensureRoleCode(input.roleCode);
    updateData.roleCode = roleCode;
    await adminAuth.setCustomUserClaims(uid, buildInternalUserClaims(roleCode));
    shouldRevokeSessions = true;
  }

  if (input.status) {
    updateData.status = input.status;
    await adminAuth.updateUser(uid, { disabled: input.status === 'disabled' });
    shouldRevokeSessions = true;
  }

  if (input.resendInvite) {
    const activationLink = await buildPasswordSetupLink(existing.email);
    const emailResult = await sendInternalInvitationEmail({
      email: existing.email,
      displayName: input.displayName?.trim() || existing.displayName,
      roleCode: input.roleCode || existing.roleCode,
      activationLink,
    });

    if (emailResult.success) {
      updateData.inviteSentAt = now();
    }
  }

  await getAdminDb().collection(COLLECTION_NAME).doc(uid).set(updateData, { merge: true });

  if (shouldRevokeSessions) {
    await adminAuth.revokeRefreshTokens(uid);
  }

  return (await getInternalUser(uid))!;
}

export async function markInternalUserLogin(uid: string): Promise<void> {
  const existing = await getInternalUser(uid);
  if (!existing) return;

  const timestamp = now();
  const updateData: Record<string, unknown> = {
    lastLoginAt: timestamp,
    updatedAt: timestamp,
    status: existing.status === 'disabled' ? 'disabled' : 'active',
  };

  if (!existing.activatedAt && existing.status !== 'disabled') {
    updateData.activatedAt = timestamp;
  }

  await getAdminDb().collection(COLLECTION_NAME).doc(uid).set(updateData, { merge: true });
}

async function syncLegacyInternalUser(
  email: string,
  providedLegacyData?: Record<string, unknown>
): Promise<InternalUser | null> {
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  const legacyData =
    providedLegacyData ||
    (
      await getAdminDb()
        .collection(LEGACY_COLLECTION_NAME)
        .doc(normalizedEmail)
        .get()
    ).data();

  if (!legacyData) {
    return null;
  }

  let authUser: UserRecord;
  try {
    authUser = await getAdminAuth().getUserByEmail(normalizedEmail);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      return null;
    }

    throw error;
  }

  const docRef = getAdminDb().collection(COLLECTION_NAME).doc(authUser.uid);
  const existing = await docRef.get();
  if (existing.exists) {
    return mapInternalUser(existing.id, existing.data());
  }

  const createdAt =
    parseDate(legacyData.createdAt) ||
    parseDate(authUser.metadata.creationTime) ||
    now();
  const updatedAt =
    parseDate(legacyData.updatedAt) ||
    parseDate(authUser.metadata.lastRefreshTime) ||
    createdAt;
  const lastLoginAt = parseDate(authUser.metadata.lastSignInTime);
  const status: InternalUserStatus = legacyData.disabled === true ? 'disabled' : 'active';
  const roleCode = mapLegacyRoleCode(legacyData.role);
  const payload: Record<string, unknown> = {
    email: normalizedEmail,
    displayName: buildDisplayName(normalizedEmail, authUser.displayName),
    roleCode,
    status,
    createdAt,
    updatedAt,
    createdBy: typeof legacyData.createdBy === 'string' ? legacyData.createdBy : '',
    inviteSentAt: null,
    activatedAt: status === 'active' ? createdAt : null,
    lastLoginAt,
  };

  await docRef.set(payload, { merge: true });
  return mapInternalUser(authUser.uid, payload);
}
