import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';
import { Certificate } from '../../domain/entities/Certificate';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { createCertificateTemplateSnapshot } from '../utils/certificate-template-snapshot';
import {
  getTemplateIssuancePolicyMessage,
  isTemplateApprovedForIssuance,
} from '@/lib/config/certificate-template-policy';

export interface UpdateDraftCertificateInput {
  certificateId: string;
  studentId: string;
  programId: string;
  templateId: string;
  campusId: string;
  issueDate: Date;
  expirationDate?: Date;
  signer1Id: string;
  signer2Id?: string;
  updatedBy: string;
}

export class UpdateDraftCertificate {
  constructor(
    private certificateRepository: ICertificateRepository,
    private studentRepository: IStudentRepository,
    private campusRepository: any = null,
    private academicAreaRepository: any = null,
    private academicProgramRepository: any = null,
    private signerRepository: any = null,
    private templateRepository: any = null
  ) {}

  async execute(input: UpdateDraftCertificateInput): Promise<Certificate> {
    const certificate = await this.certificateRepository.findById(
      input.certificateId
    );

    if (!certificate) {
      throw new Error('El certificado no existe o ya no está disponible.');
    }

    if (certificate.status !== 'draft') {
      throw new Error(
        'Solo los certificados en borrador pueden editarse desde este formulario.'
      );
    }

    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      throw new Error(
        'El participante seleccionado no existe o no está disponible.'
      );
    }

    const [campus, template, signer1, signer2, allPrograms, academicArea] =
      await Promise.all([
        this.campusRepository.findById(input.campusId),
        this.templateRepository.findById(input.templateId),
        this.signerRepository.findById(input.signer1Id),
        input.signer2Id
          ? this.signerRepository.findById(input.signer2Id)
          : Promise.resolve(null),
        this.academicProgramRepository?.findActive
          ? this.academicProgramRepository.findActive()
          : this.academicProgramRepository?.findAll
            ? this.academicProgramRepository.findAll()
            : Promise.resolve([]),
        student.academicAreaId
          ? this.academicAreaRepository.findById(student.academicAreaId)
          : Promise.resolve(null),
      ]);

    if (!campus) {
      throw new Error('El recinto seleccionado no existe o no está activo.');
    }

    if (!template || !template.isActive) {
      throw new Error(
        'La plantilla seleccionada no existe o no está activa.'
      );
    }

    if (!isTemplateApprovedForIssuance(template)) {
      throw new Error(getTemplateIssuancePolicyMessage());
    }

    if (!signer1 || !signer1.isActive) {
      throw new Error(
        'La autoridad firmante principal no existe o está inactiva.'
      );
    }

    if (input.signer2Id && (!signer2 || !signer2.isActive)) {
      throw new Error(
        'La autoridad firmante secundaria no existe o está inactiva.'
      );
    }

    const resolvedProgram =
      (Array.isArray(allPrograms) ? allPrograms : []).find(
        (program: any) => program.id === input.programId
      ) || null;

    if (!resolvedProgram) {
      throw new Error(
        'El programa académico seleccionado no existe o no está activo.'
      );
    }

    const metadata = {
      ...(certificate.metadata || {}),
      campusName: campus.name,
      programId: resolvedProgram.id,
      programName: resolvedProgram.name,
      programCode: resolvedProgram.code || null,
      signer1Id: signer1.id,
      signer1_Name: signer1.name,
      signer1_Title: signer1.title,
      signer1_SignatureImage: signer1.signatureUrl,
      signer2Id: signer2?.id || null,
      signer2_Name: signer2?.name || null,
      signer2_Title: signer2?.title || null,
      signer2_SignatureImage: signer2?.signatureUrl || null,
      lastDraftEditedAt: new Date().toISOString(),
      lastDraftEditedBy: input.updatedBy,
    } as Record<string, any>;

    if (academicArea) {
      metadata.academicArea = academicArea.name;
    } else {
      delete metadata.academicArea;
    }

    await this.certificateRepository.updateDraft(input.certificateId, {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentEmail: student.email || null,
      cedula: student.cedula || null,
      academicProgram: resolvedProgram.name,
      programId: resolvedProgram.id,
      programCodeSnapshot: resolvedProgram.code || null,
      issueDate: input.issueDate,
      expirationDate: input.expirationDate || null,
      templateId: template.id,
      templateSnapshot: createCertificateTemplateSnapshot(template),
      campusId: campus.id,
      campusNameSnapshot: campus.name,
      academicAreaId:
        academicArea && academicArea.campusId === campus.id
          ? academicArea.id
          : null,
      academicAreaNameSnapshot:
        academicArea && academicArea.campusId === campus.id
          ? academicArea.name
          : null,
      signer1Id: signer1.id,
      signer1NameSnapshot: signer1.name,
      signer2Id: signer2?.id || null,
      signer2NameSnapshot: signer2?.name || null,
      metadata,
    });

    const updated = await this.certificateRepository.findById(input.certificateId);
    if (!updated) {
      throw new Error(
        'El certificado fue actualizado, pero no se pudo volver a cargar.'
      );
    }

    return updated;
  }
}
