export type StudentImportPreviewStatus =
  | 'ready_create'
  | 'ready_update'
  | 'ready_skip'
  | 'warning'
  | 'error';

export interface StudentImportPreviewRow {
  rowNumber: number;
  matricula: string;
  firstName: string;
  lastName: string;
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  career: string;
  warnings: string[];
  errors: string[];
  status: StudentImportPreviewStatus;
  statusLabel: string;
  source: Record<string, unknown>;
}

const REQUIRED_PARTICIPANT_COLUMNS = ['Matricula'];

function toCleanString(value: unknown): string {
  return String(value ?? '').trim();
}

function splitLegacyFullName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return { firstName: '', lastName: '' };
  }

  const parts = normalized.split(' ');

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

export function detectMissingParticipantColumns(rows: Record<string, unknown>[]): string[] {
  if (!rows.length) {
    return [...REQUIRED_PARTICIPANT_COLUMNS];
  }

  const keys = new Set(
    rows.flatMap((row) => Object.keys(row || {}).map((key) => key.trim()))
  );

  const missing = REQUIRED_PARTICIPANT_COLUMNS.filter((column) => !keys.has(column));
  const hasCanonicalName = keys.has('Nombres') && keys.has('Apellidos');
  const hasLegacyName = keys.has('Nombre');

  if (!hasCanonicalName && !hasLegacyName) {
    missing.push('Nombres/Apellidos o Nombre');
  }

  return missing;
}

export function getDuplicateMatriculas(
  rows: Record<string, unknown>[]
): Set<string> {
  const occurrences = new Map<string, number>();

  for (const row of rows) {
    const matricula = toCleanString(row?.Matricula);
    if (!matricula) continue;
    occurrences.set(matricula, (occurrences.get(matricula) || 0) + 1);
  }

  return new Set(
    Array.from(occurrences.entries())
      .filter(([, count]) => count > 1)
      .map(([matricula]) => matricula)
  );
}

export function buildStudentImportPreviewRows(
  rows: Record<string, unknown>[]
): StudentImportPreviewRow[] {
  const duplicateMatriculas = getDuplicateMatriculas(rows);

  return rows.map((row, index) =>
    normalizeStudentImportRow(row, index, duplicateMatriculas)
  );
}

export function normalizeStudentImportRow(
  row: Record<string, unknown>,
  index: number,
  duplicateMatriculas: Set<string> = new Set()
): StudentImportPreviewRow {
  const matricula = toCleanString(row?.Matricula);
  const nombres = toCleanString(row?.Nombres);
  const apellidos = toCleanString(row?.Apellidos);
  const legacyName = toCleanString(row?.Nombre);
  const cedula = toCleanString(row?.Cedula);
  const email = toCleanString(row?.Email);
  const phone = toCleanString(row?.Telefono);
  const career = toCleanString(row?.Carrera);

  const warnings: string[] = [];
  const errors: string[] = [];

  let firstName = nombres;
  let lastName = apellidos;

  if (!matricula) {
    errors.push('Falta la matricula.');
  }

  if (!firstName && !lastName) {
    if (legacyName) {
      const parsedName = splitLegacyFullName(legacyName);
      firstName = parsedName.firstName;
      lastName = parsedName.lastName;
      warnings.push('La fila usa la columna legacy "Nombre".');
    } else {
      errors.push('Faltan Nombres y Apellidos.');
    }
  }

  if (duplicateMatriculas.has(matricula)) {
    errors.push('La matricula esta repetida dentro del mismo archivo.');
  }

  if (!email) {
    warnings.push('No se informo correo electronico.');
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  let status: StudentImportPreviewStatus = 'ready_create';
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
    firstName,
    lastName,
    fullName,
    cedula,
    email,
    phone,
    career,
    warnings,
    errors,
    status,
    statusLabel,
    source: row,
  };
}
