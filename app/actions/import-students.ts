'use server';

import { getStudentRepository } from '@/lib/container';
import {
  buildStudentImportPreviewRows,
  StudentImportPreviewRow,
} from '@/lib/application/utils/student-import';
import { CreateStudentDTO } from '@/lib/domain/entities/Student';

const studentRepo = getStudentRepository();

export type StudentImportDetail = {
  rowNumber: number;
  matricula: string;
  type: 'error' | 'success' | 'info' | 'warning';
  action:
    | 'created'
    | 'updated'
    | 'skipped'
    | 'failed';
  message: string;
};

export type StudentImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  warnings: number;
  errors: number;
  details: StudentImportDetail[];
};

function buildUpdates(
  existing: {
    firstName: string;
    lastName: string;
    email: string;
    cedula?: string;
    phone?: string;
    career?: string;
  },
  row: StudentImportPreviewRow
) {
  const updates: Record<string, string> = {};

  if (row.firstName && row.firstName !== existing.firstName) {
    updates.firstName = row.firstName;
  }

  if (row.lastName !== existing.lastName) {
    updates.lastName = row.lastName;
  }

  if (row.email && row.email !== existing.email) {
    updates.email = row.email;
  }

  if (row.cedula && row.cedula !== (existing.cedula || '')) {
    updates.cedula = row.cedula;
  }

  if (row.phone && row.phone !== (existing.phone || '')) {
    updates.phone = row.phone;
  }

  if (row.career && row.career !== (existing.career || '')) {
    updates.career = row.career;
  }

  return updates;
}

export async function importStudentsFromExcel(
  rawRows: Record<string, unknown>[]
): Promise<StudentImportResult> {
  const previewRows = buildStudentImportPreviewRows(rawRows);
  const details: StudentImportDetail[] = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let warnings = 0;
  let errors = 0;

  for (const row of previewRows) {
    if (row.warnings.length) {
      warnings += row.warnings.length;
      row.warnings.forEach((warning) => {
        details.push({
          rowNumber: row.rowNumber,
          matricula: row.matricula || '?',
          type: 'warning',
          action: 'skipped',
          message: warning,
        });
      });
    }

    if (row.errors.length) {
      errors += 1;
      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula || '?',
        type: 'error',
        action: 'failed',
        message: row.errors.join(' '),
      });
      continue;
    }

    try {
      const existingStudent = await studentRepo.findById(row.matricula);

      if (!existingStudent) {
        const newStudent: CreateStudentDTO = {
          id: row.matricula,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          cedula: row.cedula || undefined,
          phone: row.phone || undefined,
          career: row.career || undefined,
        };

        await studentRepo.create(newStudent);
        created += 1;
        details.push({
          rowNumber: row.rowNumber,
          matricula: row.matricula,
          type: 'success',
          action: 'created',
          message: 'Participante creado correctamente.',
        });
        continue;
      }

      const updates = buildUpdates(existingStudent, row);

      if (!Object.keys(updates).length) {
        skipped += 1;
        details.push({
          rowNumber: row.rowNumber,
          matricula: row.matricula,
          type: 'info',
          action: 'skipped',
          message: 'Participante omitido: no hay cambios nuevos para aplicar.',
        });
        continue;
      }

      await studentRepo.update(existingStudent.id, updates);
      updated += 1;
      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula,
        type: 'success',
        action: 'updated',
        message: 'Participante actualizado correctamente.',
      });
    } catch (error: any) {
      errors += 1;
      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula || '?',
        type: 'error',
        action: 'failed',
        message: error?.message || 'Error inesperado al importar la fila.',
      });
    }
  }

  return {
    total: rawRows.length,
    created,
    updated,
    skipped,
    warnings,
    errors,
    details,
  };
}
