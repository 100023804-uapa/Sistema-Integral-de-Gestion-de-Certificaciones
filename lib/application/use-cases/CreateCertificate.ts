import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';
import { GenerateFolio } from './GenerateFolio';
import { Certificate, CertificateType, CertificateStatus, CreateCertificateDTO } from '../../domain/entities/Certificate';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { getCreateCertificateStateUseCase } from '../../container';
import { createCertificateTemplateSnapshot } from '../utils/certificate-template-snapshot';
import crypto from 'crypto';
import { isTemplateApprovedForIssuance, getTemplateIssuancePolicyMessage } from '@/lib/config/certificate-template-policy';

export interface CreateCertificateInput {
    studentName: string;
    studentId: string; // Obligatorio (Matrícula)
    cedula?: string;
    type: CertificateType;
    academicProgram: string;
    programId?: string;
    issueDate: Date;
    expirationDate?: Date; // Nuevo: opcional
    prefix?: string;
    folioOverride?: string;
    metadata?: Record<string, any>;
    studentEmail?: string; // Added for student creation
    templateId?: string;
    campusId: string; // Nuevo: obligatorio
    academicAreaId?: string; // Nuevo: opcional por ahora
    createdBy: string; // Nuevo: ID del usuario que crea el certificado
    signer1Id?: string;
    signer2Id?: string;
}

export class CreateCertificate {
    constructor(
        private certificateRepository: ICertificateRepository,
        private studentRepository: IStudentRepository,
        private generateFolio: GenerateFolio,
        private campusRepository: any = null,
        private academicAreaRepository: any = null,
        private academicProgramRepository: any = null,
        private signerRepository: any = null,
        private templateRepository: any = null
    ) { }

    async execute(input: CreateCertificateInput): Promise<Certificate> {
        // 1. Gestionar Estudiante (Crear o Actualizar)
        const studentId = input.studentId;

        // Validación estricta: Matrícula es obligatoria
        if (!studentId || studentId.trim() === '') {
            throw new Error("El ID del estudiante (Matrícula/Cédula) es obligatorio para mantener la integridad de los datos.");
        }

        // Verificar si existe
        const existingStudent = await this.studentRepository.findById(studentId);

        if (!existingStudent) {
            throw new Error(
                "El participante debe existir antes de crear el certificado. Regístralo manualmente o por carga masiva y vuelve a intentarlo."
            );
        } else if (input.cedula && !existingStudent.cedula) {
            // Si ya existe pero no tiene cédula, y ahora sí se provee, la actualizamos
            await this.studentRepository.update(studentId, { cedula: input.cedula });
        }

        // 2. Validar campusId obligatorio
        if (!input.campusId || input.campusId.trim() === '') {
            throw new Error("El ID del recinto (campusId) es obligatorio para crear un certificado.");
        }

        // 3. Validar createdBy
        if (!input.createdBy || input.createdBy.trim() === '') {
            throw new Error("El ID del usuario que crea el certificado es obligatorio.");
        }

        if (!input.templateId || input.templateId.trim() === '') {
            throw new Error("La plantilla institucional es obligatoria para crear el certificado.");
        }

        if (!input.signer1Id || input.signer1Id.trim() === '') {
            throw new Error("Debes seleccionar al menos una autoridad firmante para el certificado.");
        }

        const normalizedProgramName = input.academicProgram?.trim();
        if (!normalizedProgramName) {
            throw new Error("El programa académico es obligatorio para crear el certificado.");
        }

        // 4. Resolver Folio
        let folio = input.folioOverride?.trim() || '';

        if (folio) {
            const existingCertificate = await this.certificateRepository.findByFolio(folio);
            if (existingCertificate) {
                throw new Error(`Ya existe un certificado con el folio ${folio}.`);
            }
        } else {
            folio = await this.generateFolio.execute(input.type, input.prefix);
        }

        // 5. Generar Código de Verificación Público (Hash US-13)
        const publicVerificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

        // 6. Resolver dependencias institucionales
        const enrichedMetadata = { ...input.metadata };
        const [campus, area, signer1, signer2, template, allPrograms] = await Promise.all([
            this.campusRepository.findById(input.campusId),
            input.academicAreaId ? this.academicAreaRepository.findById(input.academicAreaId) : Promise.resolve(null),
            this.signerRepository.findById(input.signer1Id),
            input.signer2Id ? this.signerRepository.findById(input.signer2Id) : Promise.resolve(null),
            this.templateRepository.findById(input.templateId),
            this.academicProgramRepository?.findActive
                ? this.academicProgramRepository.findActive()
                : this.academicProgramRepository?.findAll
                    ? this.academicProgramRepository.findAll()
                    : Promise.resolve([]),
        ]);

        if (!campus) {
            throw new Error("El recinto seleccionado no existe o no está disponible.");
        }

        if (input.academicAreaId && !area) {
            throw new Error("El área académica seleccionada no existe o no está disponible.");
        }

        if (!signer1 || !signer1.isActive) {
            throw new Error("La autoridad firmante principal no existe o está inactiva.");
        }

        if (input.signer2Id && (!signer2 || !signer2.isActive)) {
            throw new Error("La segunda autoridad firmante no existe o está inactiva.");
        }

        if (!template || !template.isActive) {
            throw new Error("La plantilla seleccionada no existe o está inactiva.");
        }

        if (!isTemplateApprovedForIssuance(template)) {
            throw new Error(getTemplateIssuancePolicyMessage());
        }

        const resolvedProgram =
            (Array.isArray(allPrograms) ? allPrograms : []).find((program: any) =>
                (input.programId && program.id === input.programId) ||
                program.name?.trim().toLowerCase() === normalizedProgramName.toLowerCase()
            ) || null;

        if (!resolvedProgram) {
            throw new Error("El programa académico seleccionado no existe o no está activo.");
        }

        // 7. Enriquecer metadatos con nombres reales para el PDF

        enrichedMetadata.campusName = campus.name;
        enrichedMetadata.programId = resolvedProgram.id;
        enrichedMetadata.programName = resolvedProgram.name;
        enrichedMetadata.programCode = resolvedProgram.code || null;

        if (area) {
            enrichedMetadata.academicArea = area.name;
        }

        // Resolver detalles de firmantes
        enrichedMetadata.signer1Id = input.signer1Id;
        enrichedMetadata.signer1_Name = signer1.name;
        enrichedMetadata.signer1_Title = signer1.title;
        enrichedMetadata.signer1_SignatureImage = signer1.signatureUrl;

        if (input.signer2Id && signer2) {
            enrichedMetadata.signer2Id = input.signer2Id;
            enrichedMetadata.signer2_Name = signer2.name;
            enrichedMetadata.signer2_Title = signer2.title;
            enrichedMetadata.signer2_SignatureImage = signer2.signatureUrl;
        }

        // 8. Preparar datos (DTO)
        const templateSnapshot =
            template ? createCertificateTemplateSnapshot(template) : null;

        const certificateData: CreateCertificateDTO & { publicVerificationCode: string } = {
            folio,
            publicVerificationCode,
            studentName: `${existingStudent.firstName} ${existingStudent.lastName}`.trim() || input.studentName,
            studentId: studentId,
            studentEmail: input.studentEmail || existingStudent.email || null,
            cedula: input.cedula || existingStudent.cedula || null,
            type: input.type,
            academicProgram: resolvedProgram.name,
            programId: resolvedProgram.id,
            programCodeSnapshot: resolvedProgram.code || null,
            issueDate: input.issueDate,
            expirationDate: input.expirationDate || null,
            status: 'draft' as CertificateStatus,
            metadata: enrichedMetadata,
            templateId: input.templateId || null,
            templateSnapshot,
            campusId: input.campusId,
            campusNameSnapshot: campus.name,
            academicAreaId: input.academicAreaId || null,
            academicAreaNameSnapshot: area?.name || null,
            signer1Id: signer1.id,
            signer1NameSnapshot: signer1.name,
            signer2Id: signer2?.id || null,
            signer2NameSnapshot: signer2?.name || null,
        };

        // 9. Guardar en repositorio de certificados
        const savedCertificate = await this.certificateRepository.create(certificateData as any);

        // 10. Crear estado inicial del certificado
        const createCertificateStateUseCase = getCreateCertificateStateUseCase();
        await createCertificateStateUseCase.execute(
            savedCertificate.id,
            'draft', // Estado inicial
            input.createdBy
        );

        return savedCertificate;
    }
}
