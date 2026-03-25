import { getAdminDb } from '@/lib/firebaseAdmin';
import { normalizeCertificateStatus } from '@/lib/types/certificateStatus';
import type {
  CertificateWorkflowLegacyItem,
  CertificateWorkflowPromotionCandidate,
  CertificateWorkflowSanitationIssue,
  CertificateWorkflowSanitationReport,
} from '@/lib/types/certificateWorkflowSanitation';
import type { SignatureStatus } from '@/lib/types/digitalSignature';

const CERTIFICATES_COLLECTION = 'certificates';
const SIGNATURES_COLLECTION = 'digitalSignatures';
const SIGNATURE_REQUESTS_COLLECTION = 'signatureRequests';

const PUBLISHED_STATUSES = new Set(['issued', 'available', 'active']);
const LEGACY_STATUSES = new Set(['active', 'revoked', 'expired']);

type LatestSignatureRecord = {
  status: SignatureStatus | null;
  hasSignatureAsset: boolean;
  signedAt: Date | null;
};

type LatestSignatureRequestRecord = {
  status: SignatureStatus | null;
  requestedAt: Date | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function compareByIssueDate<T extends { issueDate: string | null; folio: string }>(
  left: T,
  right: T
) {
  const leftTime = left.issueDate ? new Date(left.issueDate).getTime() : 0;
  const rightTime = right.issueDate ? new Date(right.issueDate).getTime() : 0;

  if (leftTime === rightTime) {
    return left.folio.localeCompare(right.folio);
  }

  return rightTime - leftTime;
}

function buildPublishedCleanupActions(recommendedState: string, findings: string[]) {
  const actions = [`Revertir el estado a ${recommendedState}.`];

  if (findings.some((item) => item.includes('firma'))) {
    actions.push('Limpiar trazas de emisión final (`issuedAt`, `issuedBy`) y rehacer el tramo de firma.');
  }

  if (findings.some((item) => item.includes('PDF'))) {
    actions.push('Invalidar o reemplazar el `pdfUrl` actual antes de reemitir.');
  }

  if (findings.some((item) => item.includes('plantilla'))) {
    actions.push('Seleccionar una plantilla oficial y regenerar el documento final.');
  }

  actions.push('Completar firma, generación y publicación bajo el nuevo flujo.');
  return actions;
}

export async function buildCertificateWorkflowSanitationReport(): Promise<CertificateWorkflowSanitationReport> {
  const [certificatesSnapshot, signaturesSnapshot, signatureRequestsSnapshot] = await Promise.all([
    getAdminDb().collection(CERTIFICATES_COLLECTION).get(),
    getAdminDb().collection(SIGNATURES_COLLECTION).get(),
    getAdminDb().collection(SIGNATURE_REQUESTS_COLLECTION).get(),
  ]);

  const latestSignatureByCertificateId = new Map<string, LatestSignatureRecord>();
  const latestSignatureRequestByCertificateId = new Map<string, LatestSignatureRequestRecord>();

  for (const signatureDoc of signaturesSnapshot.docs) {
    const data = signatureDoc.data() as Record<string, unknown>;
    const certificateId = toOptionalString(data.certificateId);
    if (!certificateId) {
      continue;
    }

    const signedAt = toDate(data.signedAt) || toDate(data.requestedAt);
    const signatureData =
      data.signatureData && typeof data.signatureData === 'object'
        ? (data.signatureData as Record<string, unknown>)
        : {};
    const hasSignatureAsset = Boolean(toOptionalString(signatureData.signatureBase64));
    const status = (toOptionalString(data.status) as SignatureStatus | null) || null;
    const current = latestSignatureByCertificateId.get(certificateId);

    if (!current || (signedAt?.getTime() || 0) >= (current.signedAt?.getTime() || 0)) {
      latestSignatureByCertificateId.set(certificateId, {
        status,
        hasSignatureAsset,
        signedAt,
      });
    }
  }

  for (const requestDoc of signatureRequestsSnapshot.docs) {
    const data = requestDoc.data() as Record<string, unknown>;
    const certificateId = toOptionalString(data.certificateId);
    if (!certificateId) {
      continue;
    }

    const requestedAt = toDate(data.requestedAt);
    const status = (toOptionalString(data.status) as SignatureStatus | null) || null;
    const current = latestSignatureRequestByCertificateId.get(certificateId);

    if (!current || (requestedAt?.getTime() || 0) >= (current.requestedAt?.getTime() || 0)) {
      latestSignatureRequestByCertificateId.set(certificateId, {
        status,
        requestedAt,
      });
    }
  }

  const sanitationCandidates: CertificateWorkflowSanitationIssue[] = [];
  const readyForAvailable: CertificateWorkflowPromotionCandidate[] = [];
  const legacyStatuses: CertificateWorkflowLegacyItem[] = [];

  let publishedCertificates = 0;
  let publishedWithoutSignature = 0;
  let publishedWithoutPdf = 0;
  let publishedWithoutTemplate = 0;
  let signedWithoutSignature = 0;
  let pendingSignatureWithoutRequest = 0;

  for (const certificateDoc of certificatesSnapshot.docs) {
    const data = certificateDoc.data() as Record<string, unknown>;
    const currentStatus = normalizeCertificateStatus(data.status);
    const folio = toOptionalString(data.folio) || certificateDoc.id;
    const studentId = toOptionalString(data.studentId) || '';
    const studentName = toOptionalString(data.studentName) || studentId || 'Sin participante';
    const issueDate = toDate(data.issueDate)?.toISOString() ?? null;
    const hasPdf = Boolean(toOptionalString(data.pdfUrl));
    const hasTemplate = Boolean(
      toOptionalString(data.templateId) ||
        (data.templateSnapshot && typeof data.templateSnapshot === 'object')
    );
    const latestSignature = latestSignatureByCertificateId.get(certificateDoc.id);
    const latestRequest = latestSignatureRequestByCertificateId.get(certificateDoc.id);
    const hasSignedSignature =
      latestSignature?.status === 'signed' && latestSignature.hasSignatureAsset === true;
    const signatureRequestStatus = latestRequest?.status ?? null;

    if (LEGACY_STATUSES.has(currentStatus)) {
      legacyStatuses.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName,
        currentStatus,
        issueDate,
        recommendation:
          currentStatus === 'active'
            ? 'Migrar a `available` si cumple firma, PDF y plantilla; si no, sanear antes.'
            : 'Revisar si este estado legacy sigue siendo necesario en el modelo actual.',
      });
    }

    if (currentStatus === 'pending_signature' && signatureRequestStatus !== 'pending') {
      pendingSignatureWithoutRequest += 1;

      sanitationCandidates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName,
        currentStatus,
        issueDate,
        signatureRequestStatus,
        hasSignedSignature,
        hasPdf,
        hasTemplate,
        findings: ['Está en espera de firma, pero no existe una solicitud pendiente válida.'],
        recommendedState: hasSignedSignature ? 'signed' : 'verified',
        cleanupActions: hasSignedSignature
          ? ['Sincronizar el estado a `signed` para reflejar la firma ya registrada.']
          : ['Regresar a `verified` y volver a generar la solicitud de firma.'],
        severity: 'medium',
      });
    }

    if (currentStatus === 'signed' && !hasSignedSignature) {
      signedWithoutSignature += 1;

      sanitationCandidates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName,
        currentStatus,
        issueDate,
        signatureRequestStatus,
        hasSignedSignature,
        hasPdf,
        hasTemplate,
        findings: ['Está marcado como firmado, pero no tiene una firma digital válida registrada.'],
        recommendedState: signatureRequestStatus === 'pending' ? 'pending_signature' : 'verified',
        cleanupActions:
          signatureRequestStatus === 'pending'
            ? ['Regresar a `pending_signature` y completar la firma pendiente.']
            : ['Regresar a `verified`, emitir nueva solicitud de firma y volver a firmar.'],
        severity: 'high',
      });
    }

    if (!PUBLISHED_STATUSES.has(currentStatus)) {
      continue;
    }

    publishedCertificates += 1;
    const findings: string[] = [];

    if (!hasSignedSignature) {
      findings.push('Publicado sin firma digital válida.');
      publishedWithoutSignature += 1;
    }

    if (!hasPdf) {
      findings.push('Publicado sin PDF final persistido.');
      publishedWithoutPdf += 1;
    }

    if (!hasTemplate) {
      findings.push('Publicado sin plantilla o snapshot asociado.');
      publishedWithoutTemplate += 1;
    }

    if (findings.length > 0) {
      const recommendedState = !hasSignedSignature
        ? signatureRequestStatus === 'pending'
          ? 'pending_signature'
          : 'verified'
        : 'signed';

      sanitationCandidates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName,
        currentStatus,
        issueDate,
        signatureRequestStatus,
        hasSignedSignature,
        hasPdf,
        hasTemplate,
        findings,
        recommendedState,
        cleanupActions: buildPublishedCleanupActions(recommendedState, findings),
        severity: 'high',
      });
      continue;
    }

    if (currentStatus === 'issued' || currentStatus === 'active') {
      readyForAvailable.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName,
        currentStatus,
        issueDate,
        notes: [
          currentStatus === 'active'
            ? 'Estado legacy; conviene migrarlo a `available` en el nuevo flujo.'
            : 'Cumple condiciones para convertirse en `available` dentro del nuevo flujo.',
        ],
        targetState: 'available',
      });
    }
  }

  return {
    summary: {
      generatedAt: new Date().toISOString(),
      totalCertificates: certificatesSnapshot.size,
      publishedCertificates,
      sanitationCandidates: sanitationCandidates.length,
      publishedWithoutSignature,
      publishedWithoutPdf,
      publishedWithoutTemplate,
      signedWithoutSignature,
      pendingSignatureWithoutRequest,
      readyForAvailable: readyForAvailable.length,
      legacyStatuses: legacyStatuses.length,
    },
    sanitationCandidates: sanitationCandidates.sort(compareByIssueDate),
    readyForAvailable: readyForAvailable.sort(compareByIssueDate),
    legacyStatuses: legacyStatuses.sort(compareByIssueDate),
  };
}
