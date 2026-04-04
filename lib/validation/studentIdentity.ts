const DOMINICAN_ID_DIGITS = 11;
const GENERIC_ID_PATTERN = /^[A-Z0-9-]{6,20}$/;

function formatDominicanIdentity(digits: string) {
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

export function normalizeStudentIdentityDocument(value: string | null | undefined) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return '';
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === DOMINICAN_ID_DIGITS) {
    return formatDominicanIdentity(digitsOnly);
  }

  return trimmed.toUpperCase().replace(/\s+/g, '');
}

export function normalizeStudentIdentityDocumentKey(
  value: string | null | undefined
) {
  const normalized = normalizeStudentIdentityDocument(value);
  if (!normalized) {
    return '';
  }

  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length === DOMINICAN_ID_DIGITS) {
    return digitsOnly;
  }

  return normalized;
}

export function validateStudentIdentityDocument(
  value: string | null | undefined
): { valid: boolean; normalized?: string; key?: string; error?: string } {
  const normalized = normalizeStudentIdentityDocument(value);

  if (!normalized) {
    return { valid: true, normalized: '', key: '' };
  }

  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length === DOMINICAN_ID_DIGITS) {
    return {
      valid: true,
      normalized,
      key: digitsOnly,
    };
  }

  if (GENERIC_ID_PATTERN.test(normalized)) {
    return {
      valid: true,
      normalized,
      key: normalized,
    };
  }

  return {
    valid: false,
    error:
      'El documento de identidad debe ser una cédula dominicana válida o un documento alfanumérico de 6 a 20 caracteres.',
  };
}
