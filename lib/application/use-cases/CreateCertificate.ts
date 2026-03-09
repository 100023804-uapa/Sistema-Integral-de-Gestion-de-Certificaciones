import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';
import { GenerateFolio } from './GenerateFolio';
import { Certificate, CertificateType, CertificateStatus, CreateCertificateDTO } from '../../domain/entities/Certificate';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { getCreateCertificateStateUseCase } from '../../container';
import { createCertificateTemplateSnapshot } from '../utils/certificate-template-snapshot';
import crypto from 'crypto';

export interface CreateCertificateInput {
    studentName: string;
    studentId: string; // Obligatorio (Matrícula)
    cedula?: string;
    type: CertificateType;
    academicProgram: string;
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
        private campusRepository: any,
        private academicAreaRepository: any,
        private signerRepository: any,
        private templateRepository: any
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
            await this.studentRepository.create({
                id: studentId,
                firstName: input.studentName,
                lastName: '',
                email: input.studentEmail || '',
                cedula: input.cedula,
                career: ''
            });
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

        // 6. Enriquecer metadatos con nombres reales para el PDF
        const enrichedMetadata = { ...input.metadata };

        // Resolver nombre de recinto
        if (input.campusId) {
            const campus = await this.campusRepository.findById(input.campusId);
            if (campus) enrichedMetadata.campusName = campus.name;
        }

        // Resolver nombre de área académica
        if (input.academicAreaId) {
            const area = await this.academicAreaRepository.findById(input.academicAreaId);
            if (area) enrichedMetadata.academicArea = area.name;
        }

        // Resolver detalles de firmantes
        if (input.signer1Id) {
            const signer1 = await this.signerRepository.findById(input.signer1Id);
            if (signer1) {
                enrichedMetadata.signer1_Name = signer1.name;
                enrichedMetadata.signer1_Title = signer1.title;
                enrichedMetadata.signer1_SignatureImage = signer1.signatureUrl;
            }
        }
        if (input.signer2Id) {
            const signer2 = await this.signerRepository.findById(input.signer2Id);
            if (signer2) {
                enrichedMetadata.signer2_Name = signer2.name;
                enrichedMetadata.signer2_Title = signer2.title;
                enrichedMetadata.signer2_SignatureImage = signer2.signatureUrl;
            }
        }

        // 7. Preparar datos (DTO)
        const templateSnapshot =
            input.templateId && this.templateRepository?.findById
                ? await this.templateRepository
                    .findById(input.templateId)
                    .then((selectedTemplate: any) =>
                        selectedTemplate ? createCertificateTemplateSnapshot(selectedTemplate) : null
                    )
                : null;

        const certificateData: CreateCertificateDTO & { publicVerificationCode: string } = {
            folio,
            publicVerificationCode,
            studentName: input.studentName,
            studentId: studentId,
            studentEmail: input.studentEmail || null,
            cedula: input.cedula || null,
            type: input.type,
            academicProgram: input.academicProgram,
            issueDate: input.issueDate,
            expirationDate: input.expirationDate || null,
            status: 'active' as CertificateStatus,
            metadata: enrichedMetadata,
            templateId: input.templateId || null,
            templateSnapshot,
            campusId: input.campusId,
            academicAreaId: input.academicAreaId || null,
        };

        // 7. Guardar en repositorio de certificados
        const savedCertificate = await this.certificateRepository.create(certificateData as any);

        // 7. Crear estado inicial del certificado
        const createCertificateStateUseCase = getCreateCertificateStateUseCase();
        await createCertificateStateUseCase.execute(
            savedCertificate.id,
            'draft', // Estado inicial
            input.createdBy
        );

        return savedCertificate;
    }
}
