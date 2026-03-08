function normalizeSerializableValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeSerializableValue);
  }

  if (value && typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }

  if (typeof value === 'undefined') {
    return '';
  }

  return value;
}

export function toSerializableImportRows(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row || {}).map(([key, value]) => [key, normalizeSerializableValue(value)])
    )
  );
}
