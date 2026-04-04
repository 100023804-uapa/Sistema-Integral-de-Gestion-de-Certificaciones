import { createCertificateTemplateSnapshot } from '@/lib/application/utils/certificate-template-snapshot';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { filterApprovedTemplatesForIssuance } from '@/lib/config/certificate-template-policy';
import { listInternalUsers } from '@/lib/server/internalUsers';
import type { CertificateTemplate } from '@/lib/types/certificateTemplate';
import type {
  CertificateMetadataSanitationActionResult,
  CertificateMetadataSanitationCertificateItem,
  CertificateMetadataSanitationInternalUser,
  CertificateMetadataSanitationReport,
  CertificateMetadataSanitationSignerSummary,
  CertificateMetadataSanitationStudentItem,
  CertificateMetadataSanitationTemplateSummary,
} from '@/lib/types/certificateMetadataSanitation';
import type { InternalUser } from '@/lib/types/internalUser';

const CERTIFICATES_COLLECTION = 'certificates';
const STUDENTS_COLLECTION = 'students';
const SIGNERS_COLLECTION = 'signers';
const TEMPLATES_COLLECTION = 'certificateTemplates';
const PROGRAMS_COLLECTION = 'academicPrograms';

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeForCatalogMatch(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isEligibleSigningInternalUser(user: InternalUser) {
  return (
    user.status !== 'disabled' &&
    (user.roleCode === 'signer' || user.roleCode === 'administrator') &&
    normalizeEmail(user.email).length > 0
  );
}

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object' && value.constructor === Object) {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => [key, sanitizeForFirestore(entryValue)] as const)
      .filter(([, entryValue]) => entryValue !== undefined);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function mapTemplateDocToEntity(id: string, data: Record<string, unknown>): CertificateTemplate {
  return {
    id,
    name: toOptionalString(data.name) || 'Plantilla sin nombre',
    description: toOptionalString(data.description) || undefined,
    type: (toOptionalString(data.type) as CertificateTemplate['type']) || 'horizontal',
    certificateTypeId: toOptionalString(data.certificateTypeId) || '',
    htmlContent: toOptionalString(data.htmlContent) || '',
    cssStyles: toOptionalString(data.cssStyles) || '',
    fontRefs: Array.isArray(data.fontRefs) ? data.fontRefs : [],
    fontProfile:
      data.fontProfile && typeof data.fontProfile === 'object'
        ? (data.fontProfile as CertificateTemplate['fontProfile'])
        : {
            status: 'unstyled',
            managedFamilies: [],
            safeFamilies: [],
            unmanagedFamilies: [],
            declaredFamilies: [],
            externalSources: [],
            riskIds: [],
          },
    layout:
      data.layout && typeof data.layout === 'object'
        ? (data.layout as CertificateTemplate['layout'])
        : {
            width: 297,
            height: 210,
            orientation: 'landscape',
            margins: { top: 20, right: 20, bottom: 20, left: 20 },
            sections: [],
          },
    placeholders: Array.isArray(data.placeholders) ? data.placeholders : [],
    isActive: data.isActive !== false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function toTemplateSummary(
  template: Pick<CertificateTemplate, 'id' | 'name' | 'isActive'>
): CertificateMetadataSanitationTemplateSummary {
  return {
    id: template.id,
    name: template.name,
    isActive: template.isActive,
  };
}

function toCertificateItem(
  id: string,
  data: Record<string, unknown>
): CertificateMetadataSanitationCertificateItem {
  return {
    certificateId: id,
    folio: toOptionalString(data.folio) || id,
    studentId: toOptionalString(data.studentId) || '',
    studentName: toOptionalString(data.studentName) || 'Sin participante',
    status: toOptionalString(data.status) || 'draft',
    academicProgram: toOptionalString(data.academicProgram) || 'Sin programa',
    campusId: toOptionalString(data.campusId),
    templateId: toOptionalString(data.templateId),
    signer1Id: toOptionalString(data.signer1Id),
    programId: toOptionalString(data.programId),
  };
}

function toStudentItem(
  id: string,
  data: Record<string, unknown>
): CertificateMetadataSanitationStudentItem {
  const firstName = toOptionalString(data.firstName) || '';
  const lastName = toOptionalString(data.lastName) || '';
  const studentName = `${firstName} ${lastName}`.trim() || id;

  return {
    studentId: id,
    studentName,
    email: toOptionalString(data.email),
    programId: toOptionalString(data.programId),
    campusId: toOptionalString(data.campusId),
    academicAreaId: toOptionalString(data.academicAreaId),
  };
}

function toInternalUserSummary(user: InternalUser): CertificateMetadataSanitationInternalUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    roleCode: user.roleCode,
    status: user.status,
  };
}

function toSignerSummary(
  signerId: string,
  data: Record<string, unknown>,
  signingUsers: InternalUser[]
): CertificateMetadataSanitationSignerSummary {
  const allowedEmails = Array.isArray(data.allowedEmails)
    ? data.allowedEmails
        .map((email) => (typeof email === 'string' ? normalizeEmail(email) : ''))
        .filter(Boolean)
    : [];

  const authorizedInternalUsers = signingUsers
    .filter((user) => allowedEmails.includes(normalizeEmail(user.email)))
    .map(toInternalUserSummary);

  return {
    id: signerId,
    name: toOptionalString(data.name) || signerId,
    title: toOptionalString(data.title) || 'Sin cargo',
    isActive: data.isActive !== false,
    allowedEmails,
    authorizedInternalUsers,
  };
}

async function loadSanitationContext() {
  const [
    certificatesSnapshot,
    studentsSnapshot,
    signersSnapshot,
    templatesSnapshot,
    programsSnapshot,
    internalUsers,
  ] =
    await Promise.all([
      getAdminDb().collection(CERTIFICATES_COLLECTION).get(),
      getAdminDb().collection(STUDENTS_COLLECTION).get(),
      getAdminDb().collection(SIGNERS_COLLECTION).get(),
      getAdminDb().collection(TEMPLATES_COLLECTION).get(),
      getAdminDb().collection(PROGRAMS_COLLECTION).get(),
      listInternalUsers(),
    ]);

  const signingUsers = internalUsers.filter(isEligibleSigningInternalUser);
  const templates = templatesSnapshot.docs.map((doc) =>
    mapTemplateDocToEntity(doc.id, doc.data() as Record<string, unknown>)
  );
  const approvedTemplate = filterApprovedTemplatesForIssuance(templates)[0] || null;
  const activeSigners = signersSnapshot.docs
    .map((doc) => toSignerSummary(doc.id, doc.data() as Record<string, unknown>, signingUsers))
    .filter((signer) => signer.isActive);
  const activePrograms = programsSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      name: toOptionalString(doc.data().name) || doc.id,
      campusId: toOptionalString(doc.data().campusId),
      academicAreaId: toOptionalString(doc.data().academicAreaId),
      isActive: doc.data().isActive !== false,
    }))
    .filter((program) => program.isActive);

  return {
    certificatesSnapshot,
    studentsSnapshot,
    signersSnapshot,
    templates,
    approvedTemplate,
    activeSigners,
    activePrograms,
    signingUsers,
  };
}

export async function buildCertificateMetadataSanitationReport(): Promise<CertificateMetadataSanitationReport> {
  const {
    certificatesSnapshot,
    studentsSnapshot,
    approvedTemplate,
    activeSigners,
    activePrograms,
    signingUsers,
  } =
    await loadSanitationContext();

  const certificatesMissingTemplate: CertificateMetadataSanitationCertificateItem[] = [];
  const certificatesMissingPrimarySigner: CertificateMetadataSanitationCertificateItem[] = [];
  const certificatesMissingProgramId: CertificateMetadataSanitationCertificateItem[] = [];
  const studentsMissingCatalogLinks: CertificateMetadataSanitationStudentItem[] = [];

  const programMatchMap = new Map(
    activePrograms.map((program) => [normalizeForCatalogMatch(program.name), program] as const)
  );

  for (const certificateDoc of certificatesSnapshot.docs) {
    const data = certificateDoc.data() as Record<string, unknown>;
    const item = toCertificateItem(certificateDoc.id, data);
    const matchedProgram = programMatchMap.get(normalizeForCatalogMatch(item.academicProgram)) || null;
    if (matchedProgram) {
      item.matchedProgramId = matchedProgram.id;
      item.matchedProgramName = matchedProgram.name;
    }

    if (!item.templateId) {
      certificatesMissingTemplate.push(item);
    }

    if (!item.signer1Id) {
      certificatesMissingPrimarySigner.push(item);
    }

    if (!item.programId) {
      certificatesMissingProgramId.push(item);
    }
  }

  for (const studentDoc of studentsSnapshot.docs) {
    const item = toStudentItem(studentDoc.id, studentDoc.data() as Record<string, unknown>);
    if (!item.programId || !item.campusId || !item.academicAreaId || !item.email) {
      studentsMissingCatalogLinks.push(item);
    }
  }

  return {
    summary: {
      generatedAt: new Date().toISOString(),
      totalCertificates: certificatesSnapshot.size,
      totalStudents: studentsSnapshot.size,
      totalActiveSigners: activeSigners.length,
      certificatesMissingTemplate: certificatesMissingTemplate.length,
      certificatesMissingPrimarySigner: certificatesMissingPrimarySigner.length,
      certificatesMissingProgramId: certificatesMissingProgramId.length,
      studentsMissingProgramId: studentsMissingCatalogLinks.filter((item) => !item.programId).length,
      studentsMissingCampusId: studentsMissingCatalogLinks.filter((item) => !item.campusId).length,
      studentsMissingAcademicAreaId: studentsMissingCatalogLinks.filter((item) => !item.academicAreaId).length,
      studentsMissingEmail: studentsMissingCatalogLinks.filter((item) => !item.email).length,
      signersWithoutAllowedEmails: activeSigners.filter((item) => item.allowedEmails.length === 0).length,
      signersWithoutAuthorizedInternalUsers: activeSigners.filter(
        (item) => item.authorizedInternalUsers.length === 0
      ).length,
    },
    preferredTemplate: approvedTemplate ? toTemplateSummary(approvedTemplate) : null,
    certificatesMissingTemplate,
    certificatesMissingPrimarySigner,
    certificatesMissingProgramId,
    studentsMissingCatalogLinks,
    activeSigners,
    signingInternalUsers: signingUsers.map(toInternalUserSummary),
  };
}

export async function applyPreferredTemplateToMissingCertificates(
  changedBy: string,
  certificateIds?: string[]
): Promise<CertificateMetadataSanitationActionResult> {
  const { certificatesSnapshot, approvedTemplate } = await loadSanitationContext();

  if (!approvedTemplate) {
    throw new Error('No existe una plantilla oficial activa disponible para saneamiento.');
  }

  const templateSnapshot = createCertificateTemplateSnapshot(approvedTemplate);
  const selectedIds = certificateIds?.length ? new Set(certificateIds) : null;

  let updatedCertificates = 0;
  let skippedCertificates = 0;

  for (const certificateDoc of certificatesSnapshot.docs) {
    if (selectedIds && !selectedIds.has(certificateDoc.id)) {
      continue;
    }

    const data = certificateDoc.data() as Record<string, unknown>;
    const currentTemplateId = toOptionalString(data.templateId);
    if (currentTemplateId) {
      skippedCertificates += 1;
      continue;
    }

    const currentMetadata =
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {};

    await certificateDoc.ref.update(
      sanitizeForFirestore({
        templateId: approvedTemplate.id,
        templateSnapshot,
        updatedAt: new Date(),
        metadata: {
          ...currentMetadata,
          templateId: approvedTemplate.id,
          sanitation: {
            ...(currentMetadata.sanitation && typeof currentMetadata.sanitation === 'object'
              ? (currentMetadata.sanitation as Record<string, unknown>)
              : {}),
            templateBackfilledAt: new Date(),
            templateBackfilledBy: changedBy,
          },
        },
      })
    );

    updatedCertificates += 1;
  }

  return {
    action: 'apply_preferred_template',
    updatedCertificates,
    updatedSigners: 0,
    skippedCertificates,
    skippedSigners: 0,
    message:
      updatedCertificates > 0
        ? `Se aplicó la plantilla oficial a ${updatedCertificates} certificado(s) sin plantilla.`
        : 'No había certificados pendientes de plantilla oficial.',
  };
}

export async function assignPrimarySignerToMissingCertificates(
  signerId: string,
  changedBy: string,
  certificateIds?: string[]
): Promise<CertificateMetadataSanitationActionResult> {
  const { certificatesSnapshot, activeSigners } = await loadSanitationContext();
  const selectedSigner = activeSigners.find((item) => item.id === signerId) || null;

  if (!selectedSigner) {
    throw new Error('El firmante seleccionado no existe o está inactivo.');
  }

  const selectedIds = certificateIds?.length ? new Set(certificateIds) : null;
  let updatedCertificates = 0;
  let skippedCertificates = 0;

  for (const certificateDoc of certificatesSnapshot.docs) {
    if (selectedIds && !selectedIds.has(certificateDoc.id)) {
      continue;
    }

    const data = certificateDoc.data() as Record<string, unknown>;
    const currentSignerId = toOptionalString(data.signer1Id);
    if (currentSignerId) {
      skippedCertificates += 1;
      continue;
    }

    const currentMetadata =
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {};

    await certificateDoc.ref.update(
      sanitizeForFirestore({
        signer1Id: selectedSigner.id,
        signer1NameSnapshot: selectedSigner.name,
        updatedAt: new Date(),
        metadata: {
          ...currentMetadata,
          signer1Id: selectedSigner.id,
          signer1Name: selectedSigner.name,
          sanitation: {
            ...(currentMetadata.sanitation && typeof currentMetadata.sanitation === 'object'
              ? (currentMetadata.sanitation as Record<string, unknown>)
              : {}),
            signerBackfilledAt: new Date(),
            signerBackfilledBy: changedBy,
          },
        },
      })
    );

    updatedCertificates += 1;
  }

  return {
    action: 'assign_primary_signer',
    updatedCertificates,
    updatedSigners: 0,
    skippedCertificates,
    skippedSigners: 0,
    message:
      updatedCertificates > 0
        ? `Se asignó el firmante principal a ${updatedCertificates} certificado(s) sin firmante.`
        : 'No había certificados pendientes de firmante principal.',
  };
}

export async function authorizeInternalEmailForSigner(
  signerId: string,
  email: string
): Promise<CertificateMetadataSanitationActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Debes indicar un correo interno válido para vincular al firmante.');
  }

  const { signersSnapshot, signingUsers } = await loadSanitationContext();
  const internalUser = signingUsers.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;

  if (!internalUser) {
    throw new Error('El correo seleccionado no pertenece a un usuario interno habilitado para firmar.');
  }

  const signerDoc = signersSnapshot.docs.find((doc) => doc.id === signerId) || null;
  if (!signerDoc) {
    throw new Error('El firmante seleccionado no existe.');
  }

  const signerData = signerDoc.data() as Record<string, unknown>;
  if (signerData.isActive === false) {
    throw new Error('El firmante seleccionado está inactivo.');
  }

  const existingEmails = Array.isArray(signerData.allowedEmails)
    ? signerData.allowedEmails
        .map((value) => (typeof value === 'string' ? normalizeEmail(value) : ''))
        .filter(Boolean)
    : [];

  if (existingEmails.includes(normalizedEmail)) {
    return {
      action: 'authorize_signer_email',
      updatedCertificates: 0,
      updatedSigners: 0,
      skippedCertificates: 0,
      skippedSigners: 1,
      message: 'Ese correo ya estaba autorizado para el firmante seleccionado.',
    };
  }

  await signerDoc.ref.update({
    allowedEmails: [...existingEmails, normalizedEmail],
    updatedAt: new Date(),
  });

  return {
    action: 'authorize_signer_email',
    updatedCertificates: 0,
    updatedSigners: 1,
    skippedCertificates: 0,
    skippedSigners: 0,
    message: 'Se vinculó el correo interno al firmante institucional.',
  };
}

export async function applyProgramMatchesToCertificates(
  changedBy: string,
  certificateIds?: string[]
): Promise<CertificateMetadataSanitationActionResult> {
  const { certificatesSnapshot, activePrograms } = await loadSanitationContext();

  const programMatchMap = new Map(
    activePrograms.map((program) => [normalizeForCatalogMatch(program.name), program] as const)
  );
  const selectedIds = certificateIds?.length ? new Set(certificateIds) : null;

  let updatedCertificates = 0;
  let skippedCertificates = 0;

  for (const certificateDoc of certificatesSnapshot.docs) {
    if (selectedIds && !selectedIds.has(certificateDoc.id)) {
      continue;
    }

    const data = certificateDoc.data() as Record<string, unknown>;
    const currentProgramId = toOptionalString(data.programId);
    if (currentProgramId) {
      skippedCertificates += 1;
      continue;
    }

    const academicProgram = toOptionalString(data.academicProgram);
    const matchedProgram = academicProgram
      ? programMatchMap.get(normalizeForCatalogMatch(academicProgram)) || null
      : null;

    if (!matchedProgram) {
      skippedCertificates += 1;
      continue;
    }

    const currentMetadata =
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {};

    await certificateDoc.ref.update(
      sanitizeForFirestore({
        programId: matchedProgram.id,
        campusId: toOptionalString(data.campusId) || matchedProgram.campusId || null,
        academicAreaId:
          toOptionalString(data.academicAreaId) || matchedProgram.academicAreaId || null,
        updatedAt: new Date(),
        metadata: {
          ...currentMetadata,
          programId: matchedProgram.id,
          sanitation: {
            ...(currentMetadata.sanitation && typeof currentMetadata.sanitation === 'object'
              ? (currentMetadata.sanitation as Record<string, unknown>)
              : {}),
            programBackfilledAt: new Date(),
            programBackfilledBy: changedBy,
          },
        },
      })
    );

    updatedCertificates += 1;
  }

  return {
    action: 'apply_program_matches',
    updatedCertificates,
    updatedSigners: 0,
    skippedCertificates,
    skippedSigners: 0,
    message:
      updatedCertificates > 0
        ? `Se alineó el programa en ${updatedCertificates} certificado(s) usando el catálogo activo.`
        : 'No había certificados que pudieran alinearse automáticamente con el catálogo de programas.',
  };
}
