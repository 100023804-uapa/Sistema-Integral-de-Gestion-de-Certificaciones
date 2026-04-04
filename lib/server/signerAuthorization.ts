import { getCertificateRepository, getSignerRepository } from '@/lib/container';
import { listInternalUsers } from '@/lib/server/internalUsers';
import type { InternalUser, InternalUserStatus } from '@/lib/types/internalUser';
import type { Signer } from '@/lib/types/signer';

export type SigningAuthorizationMode =
  | 'scoped'
  | 'role_fallback_no_signers'
  | 'role_fallback_no_allowed_emails';

export interface EligibleSigningUser {
  uid: string;
  email: string;
  displayName: string;
  roleCode: string;
  status: InternalUserStatus;
  authorizationMode: SigningAuthorizationMode;
  authorizedSignerIds: string[];
  authorizedSignerNames: string[];
}

export interface SigningAuthorizationResult {
  users: EligibleSigningUser[];
  mode: SigningAuthorizationMode;
  signers: Signer[];
  explanation: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isSigningRole(roleCode: string) {
  return roleCode === 'signer' || roleCode === 'administrator';
}

function getEligibleBaseUsers(users: InternalUser[]) {
  return users.filter(
    (user) => user.status !== 'disabled' && isSigningRole(user.roleCode) && normalizeEmail(user.email).length > 0
  );
}

async function resolveSignersByIds(signerIds: string[]) {
  const uniqueIds = Array.from(new Set(signerIds.filter(Boolean)));
  const signerRepository = getSignerRepository();
  const resolved = await Promise.all(uniqueIds.map((id) => signerRepository.findById(id)));
  return resolved.filter((signer): signer is Signer => Boolean(signer && signer.isActive));
}

export async function getCertificateSignerScope(certificateId: string) {
  const certificate = await getCertificateRepository().findById(certificateId);

  if (!certificate) {
    throw new Error('El certificado no existe.');
  }

  const signerIds = [
    certificate.signer1Id,
    certificate.signer2Id,
    typeof certificate.metadata?.signer1Id === 'string' ? certificate.metadata.signer1Id : '',
    typeof certificate.metadata?.signer2Id === 'string' ? certificate.metadata.signer2Id : '',
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const signers = await resolveSignersByIds(signerIds);

  return {
    certificate,
    signers,
  };
}

export async function listEligibleSigningUsersForSignerIds(signerIds: string[]) {
  const [signers, internalUsers] = await Promise.all([
    resolveSignersByIds(signerIds),
    listInternalUsers(),
  ]);

  const baseUsers = getEligibleBaseUsers(internalUsers);

  if (signers.length === 0) {
    return {
      users: baseUsers.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
        status: user.status,
        authorizationMode: 'role_fallback_no_signers' as const,
        authorizedSignerIds: [],
        authorizedSignerNames: [],
      })),
      mode: 'role_fallback_no_signers' as const,
      signers,
      explanation:
        'El certificado todavía no tiene firmantes institucionales configurados. Se muestran usuarios internos firmantes por rol para no bloquear la operación.',
    } satisfies SigningAuthorizationResult;
  }

  const signerEmailScopes = signers.map((signer) => ({
    signer,
    emails: (signer.allowedEmails || []).map(normalizeEmail).filter(Boolean),
  }));

  const hasScopedEmails = signerEmailScopes.some((scope) => scope.emails.length > 0);

  if (!hasScopedEmails) {
    return {
      users: baseUsers.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
        status: user.status,
        authorizationMode: 'role_fallback_no_allowed_emails' as const,
        authorizedSignerIds: signers.map((signer) => signer.id),
        authorizedSignerNames: signers.map((signer) => signer.name),
      })),
      mode: 'role_fallback_no_allowed_emails' as const,
      signers,
      explanation:
        'Los firmantes institucionales existen, pero aún no tienen usuarios internos autorizados vinculados por correo. Se muestran firmantes internos por rol hasta sanear esa relación.',
    } satisfies SigningAuthorizationResult;
  }

  const scopedUsers = baseUsers
    .map((user) => {
      const normalizedUserEmail = normalizeEmail(user.email);
      const authorizedSigners = signerEmailScopes
        .filter((scope) => scope.emails.includes(normalizedUserEmail))
        .map((scope) => scope.signer);

      if (authorizedSigners.length === 0) {
        return null;
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
        status: user.status,
        authorizationMode: 'scoped' as const,
        authorizedSignerIds: authorizedSigners.map((signer) => signer.id),
        authorizedSignerNames: authorizedSigners.map((signer) => signer.name),
      } satisfies EligibleSigningUser;
    })
    .filter((user) => user !== null) as EligibleSigningUser[];

  return {
    users: scopedUsers,
    mode: 'scoped' as const,
    signers,
    explanation:
      'Solo se muestran usuarios internos autorizados por los firmantes institucionales configurados en el certificado.',
  } satisfies SigningAuthorizationResult;
}

export async function listEligibleSigningUsersForCertificate(certificateId: string) {
  const { signers } = await getCertificateSignerScope(certificateId);
  return listEligibleSigningUsersForSignerIds(signers.map((signer) => signer.id));
}

export async function assertInternalUserCanSignCertificate(certificateId: string, internalUserUid: string) {
  const authorization = await listEligibleSigningUsersForCertificate(certificateId);
  const matchedUser = authorization.users.find((user) => user.uid === internalUserUid) || null;

  if (!matchedUser) {
    throw new Error('El usuario interno seleccionado no está autorizado para firmar este certificado.');
  }

  return {
    user: matchedUser,
    mode: authorization.mode,
    signers: authorization.signers,
  };
}
