import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';
import { GenerateFolio } from './GenerateFolio';
import { Certificate, CertificateType, CertificateStatus, CreateCertificateDTO } from '../../domain/entities/Certificate';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { getCreateCertificateStateUseCase } from '../../container';

export interface CreateCertificateInput {
    studentName: string;
    studentId: string; // Obligatorio (Matrícula)
    cedula?: string;
    type: CertificateType;
    academicProgram: string;
    issueDate: Date;
    prefix?: string;
    metadata?: Record<string, any>;
    studentEmail?: string; // Added for student creation
    templateId?: string;
    campusId: string; // Nuevo: obligatorio
    academicAreaId?: string; // Nuevo: opcional por ahora
    createdBy: string; // Nuevo: ID del usuario que crea el certificado
}

export class CreateCertificate {
    constructor(
        private certificateRepository: ICertificateRepository,
        private studentRepository: IStudentRepository,
        private generateFolio: GenerateFolio
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

        // 4. Generar Folio
        const folio = await this.generateFolio.execute(input.type, input.prefix);

        // 5. Preparar datos (DTO)
        const certificateData: CreateCertificateDTO = {
            folio,
            studentName: input.studentName,
            studentId: studentId,
            type: input.type,
            academicProgram: input.academicProgram,
            issueDate: input.issueDate,
            status: 'active' as CertificateStatus,
            metadata: input.metadata || {},
            templateId: input.templateId,
            campusId: input.campusId,
            academicAreaId: input.academicAreaId,
        };

        // 6. Guardar en repositorio de certificados
        const savedCertificate = await this.certificateRepository.create(certificateData);

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
