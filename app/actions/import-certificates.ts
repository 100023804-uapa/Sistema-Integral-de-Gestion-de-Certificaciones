'use server';

import { getCreateCertificateUseCase, getStudentRepository } from '@/lib/container';
import { CreateStudentDTO } from '@/lib/domain/entities/Student';
import {
  buildCertificateImportPreviewRows,
  CertificateImportPreviewRow,
} from '@/lib/application/utils/certificate-import';

const studentRepo = getStudentRepository();

export interface CertificateImportOptions {
  campusId: string;
  academicAreaId?: string;
  templateId?: string;
  signer1Id?: string;
  signer2Id?: string;
  programName?: string;
  expirationDate?: string;
  createdBy?: string;
}

export type CertificateImportDetail = {
  rowNumber: number;
  matricula: string;
  folio: string;
  type: 'error' | 'success' | 'info' | 'warning';
  action:
    | 'created_student_and_certificate'
    | 'updated_student_and_certificate'
    | 'created_certificate'
    | 'skipped_duplicate'
    | 'failed';
  message: string;
};

export type CertificateImportResult = {
  total: number;
  certificatesCreated: number;
  studentsCreated: number;
  studentsUpdated: number;
  skipped: number;
  warnings: number;
  errors: number;
  details: CertificateImportDetail[];
};

export type ImportResult = CertificateImportResult;

function normalizeOptions(
  optionsOrCampusId: CertificateImportOptions | string,
  templateId?: string
): CertificateImportOptions {
  if (typeof optionsOrCampusId === 'string') {
    return {
      campusId: optionsOrCampusId,
      templateId,
      createdBy: 'bulk-import',
    };
  }

  return {
    ...optionsOrCampusId,
    createdBy: optionsOrCampusId.createdBy || 'bulk-import',
  };
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

function parseExpirationDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const parsedDate = new Date(value);
  return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

function parseIssueDate(row: CertificateImportPreviewRow): Date {
  if (!row.issueDate) {
    return new Date();
  }

  const parsedDate = new Date(row.issueDate);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function buildStudentUpdates(
  existingStudent: {
    firstName: string;
    lastName: string;
    email: string;
    cedula?: string;
    career?: string;
  },
  previewRow: CertificateImportPreviewRow
) {
  const updates: Record<string, string> = {};
  const parsedName = splitLegacyFullName(previewRow.studentName);

  if (parsedName.firstName && parsedName.firstName !== existingStudent.firstName) {
    updates.firstName = parsedName.firstName;
  }

  if (parsedName.lastName !== existingStudent.lastName) {
    updates.lastName = parsedName.lastName;
  }

  if (previewRow.email && previewRow.email !== existingStudent.email) {
    updates.email = previewRow.email;
  }

  if (previewRow.cedula && previewRow.cedula !== (existingStudent.cedula || '')) {
    updates.cedula = previewRow.cedula;
  }

  if (previewRow.academicProgram && previewRow.academicProgram !== (existingStudent.career || '')) {
    updates.career = previewRow.academicProgram;
  }

  return updates;
}

export async function importCertificatesFromExcel(
  rawRows: Record<string, unknown>[],
  optionsOrCampusId: CertificateImportOptions | string,
  templateId?: string
): Promise<CertificateImportResult> {
  const options = normalizeOptions(optionsOrCampusId, templateId);

  if (!options.campusId?.trim()) {
    throw new Error('Debes seleccionar un recinto antes de importar certificados.');
  }

  const createCertificateUseCase = getCreateCertificateUseCase();
  const previewRows = buildCertificateImportPreviewRows(rawRows, {
    programOverride: options.programName,
  });

  const details: CertificateImportDetail[] = [];
  let certificatesCreated = 0;
  let studentsCreated = 0;
  let studentsUpdated = 0;
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
          folio: row.folio || 'AUTO',
          type: 'warning',
          action: 'created_certificate',
          message: warning,
        });
      });
    }

    if (row.errors.length) {
      errors += 1;
      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula || '?',
        folio: row.folio || 'AUTO',
        type: 'error',
        action: 'failed',
        message: row.errors.join(' '),
      });
      continue;
    }

    try {
      let studentWasCreated = false;
      let studentWasUpdated = false;

      const existingStudent = await studentRepo.findById(row.matricula);

      if (!existingStudent) {
        const parsedName = splitLegacyFullName(row.studentName);
        const newStudent: CreateStudentDTO = {
          id: row.matricula,
          firstName: parsedName.firstName || row.studentName,
          lastName: parsedName.lastName,
          email: row.email,
          cedula: row.cedula || undefined,
          career: row.academicProgram || undefined,
        };
        await studentRepo.create(newStudent);
        studentsCreated += 1;
        studentWasCreated = true;
      } else {
        const updates = buildStudentUpdates(existingStudent, row);
        if (Object.keys(updates).length) {
          await studentRepo.update(existingStudent.id, updates);
          studentsUpdated += 1;
          studentWasUpdated = true;
        }
      }

      await createCertificateUseCase.execute({
        studentName: row.studentName,
        studentId: row.matricula,
        cedula: row.cedula || undefined,
        studentEmail: row.email || undefined,
        type: row.certificateType,
        academicProgram: row.academicProgram,
        issueDate: parseIssueDate(row),
        expirationDate: parseExpirationDate(options.expirationDate),
        templateId: options.templateId || undefined,
        campusId: options.campusId,
        academicAreaId: options.academicAreaId || undefined,
        signer1Id: options.signer1Id || undefined,
        signer2Id: options.signer2Id || undefined,
        folioOverride: row.folio || undefined,
        createdBy: options.createdBy || 'bulk-import',
        metadata: {
          importedAt: new Date().toISOString(),
          source: 'excel_bulk_import',
          grade: String(row.source?.Calificacion ?? '').trim(),
          duration: String(row.source?.Duracion ?? '').trim(),
          description: String(row.source?.Descripcion ?? '').trim(),
        },
      });

      certificatesCreated += 1;

      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula,
        folio: row.folio || 'AUTO',
        type: 'success',
        action: studentWasCreated
          ? 'created_student_and_certificate'
          : studentWasUpdated
            ? 'updated_student_and_certificate'
            : 'created_certificate',
        message: studentWasCreated
          ? 'Participante creado y certificado emitido correctamente.'
          : studentWasUpdated
            ? 'Participante actualizado y certificado emitido correctamente.'
            : 'Certificado emitido correctamente sobre un participante existente.',
      });
    } catch (error: any) {
      const message = error?.message || 'Error inesperado al importar el certificado.';

      if (/Ya existe un certificado con el folio/i.test(message)) {
        skipped += 1;
        details.push({
          rowNumber: row.rowNumber,
          matricula: row.matricula || '?',
          folio: row.folio || 'AUTO',
          type: 'info',
          action: 'skipped_duplicate',
          message,
        });
        continue;
      }

      errors += 1;
      details.push({
        rowNumber: row.rowNumber,
        matricula: row.matricula || '?',
        folio: row.folio || 'AUTO',
        type: 'error',
        action: 'failed',
        message,
      });
    }
  }

  return {
    total: rawRows.length,
    certificatesCreated,
    studentsCreated,
    studentsUpdated,
    skipped,
    warnings,
    errors,
    details,
  };
}
