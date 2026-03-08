export type CertificateImportPreviewStatus =
  | 'ready_create'
  | 'warning'
  | 'error';

export interface CertificateImportPreviewRow {
  rowNumber: number;
  matricula: string;
  studentName: string;
  academicProgram: string;
  folio: string;
  certificateType: 'CAP' | 'PROFUNDO';
  issueDate: string;
  cedula: string;
  email: string;
  warnings: string[];
  errors: string[];
  status: CertificateImportPreviewStatus;
  statusLabel: string;
  source: Record<string, unknown>;
}

interface CertificateImportPreviewOptions {
  programOverride?: string;
}

const REQUIRED_CERTIFICATE_COLUMNS = ['Matricula', 'Nombre'];

function toCleanString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeCertificateType(value: string): 'CAP' | 'PROFUNDO' {
  return value.toUpperCase() === 'PROFUNDO' ? 'PROFUNDO' : 'CAP';
}

function normalizeIssueDate(value: unknown): { normalized: string; warning?: string } {
  if (typeof value === 'number') {
    const parsedDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return {
      normalized: isNaN(parsedDate.getTime())
        ? ''
        : parsedDate.toISOString().split('T')[0],
      warning: isNaN(parsedDate.getTime()) ? 'Fecha invalida; se usara la fecha actual.' : undefined,
    };
  }

  const raw = toCleanString(value);
  if (!raw) {
    return { normalized: '', warning: 'No se informo fecha; se usara la fecha actual.' };
  }

  const parsedDate = new Date(raw);
  if (isNaN(parsedDate.getTime())) {
    return { normalized: '', warning: 'Fecha invalida; se usara la fecha actual.' };
  }

  return { normalized: parsedDate.toISOString().split('T')[0] };
}

export function detectMissingCertificateColumns(rows: Record<string, unknown>[]): string[] {
  if (!rows.length) {
    return [...REQUIRED_CERTIFICATE_COLUMNS, 'Curso o ProgramaGlobal'];
  }

  const keys = new Set(
    rows.flatMap((row) => Object.keys(row || {}).map((key) => key.trim()))
  );

  return REQUIRED_CERTIFICATE_COLUMNS.filter((column) => !keys.has(column));
}

function getDuplicateFolios(rows: Record<string, unknown>[]): Set<string> {
  const occurrences = new Map<string, number>();

  for (const row of rows) {
    const folio = toCleanString(row?.Folio);
    if (!folio) continue;
    occurrences.set(folio, (occurrences.get(folio) || 0) + 1);
  }

  return new Set(
    Array.from(occurrences.entries())
      .filter(([, count]) => count > 1)
      .map(([folio]) => folio)
  );
}

export function buildCertificateImportPreviewRows(
  rows: Record<string, unknown>[],
  options: CertificateImportPreviewOptions = {}
): CertificateImportPreviewRow[] {
  const duplicateFolios = getDuplicateFolios(rows);

  return rows.map((row, index) => {
    const matricula = toCleanString(row?.Matricula);
    const studentName = toCleanString(row?.Nombre);
    const academicProgram = options.programOverride || toCleanString(row?.Curso);
    const folio = toCleanString(row?.Folio);
    const cedula = toCleanString(row?.Cedula);
    const email = toCleanString(row?.Email);
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!matricula) {
      errors.push('Falta la matricula.');
    }

    if (!studentName) {
      errors.push('Falta el nombre del participante.');
    }

    if (!academicProgram) {
      errors.push('Falta el programa academico o la columna Curso.');
    }

    if (!folio) {
      warnings.push('No se informo folio; el sistema lo generara automaticamente.');
    } else if (duplicateFolios.has(folio)) {
      errors.push('El folio esta repetido dentro del mismo archivo.');
    }

    const issueDateResult = normalizeIssueDate(row?.Fecha);
    if (issueDateResult.warning) {
      warnings.push(issueDateResult.warning);
    }

    let status: CertificateImportPreviewStatus = 'ready_create';
    let statusLabel = 'Listo para crear';

    if (errors.length > 0) {
      status = 'error';
      statusLabel = 'Error';
    } else if (warnings.length > 0) {
      status = 'warning';
      statusLabel = 'Requiere revision';
    }

    return {
      rowNumber: index + 2,
      matricula,
      studentName,
      academicProgram,
      folio,
      certificateType: normalizeCertificateType(toCleanString(row?.Tipo)),
      issueDate: issueDateResult.normalized,
      cedula,
      email,
      warnings,
      errors,
      status,
      statusLabel,
      source: row,
    };
  });
}
