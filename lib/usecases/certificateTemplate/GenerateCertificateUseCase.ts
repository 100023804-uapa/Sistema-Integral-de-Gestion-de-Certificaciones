import { GeneratedCertificate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import {
  getCertificateRepository,
  getSignerRepository,
  getCampusRepository,
  getAcademicAreaRepository,
  getAcademicProgramRepository
} from '@/lib/container';
import { CertificateGenerationService } from '@/lib/services/CertificateGenerationService';

export class GenerateCertificateUseCase {
  constructor(
    private templateRepository: FirebaseCertificateTemplateRepository
  ) {
    this.certificateService = CertificateGenerationService.getInstance();
  }

  private certificateService: CertificateGenerationService;

  async execute(
    certificateId: string,
    templateId: string,
    options: {
      includeQR?: boolean;
      includeSignature?: boolean;
      watermark?: boolean;
      quality?: 'low' | 'medium' | 'high';
    } = {},
    generatedBy: string
  ): Promise<GeneratedCertificate> {
    // Validaciones
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!templateId?.trim()) {
      throw new Error('El ID de la plantilla es obligatorio');
    }

    if (!generatedBy?.trim()) {
      throw new Error('El ID del usuario que genera es obligatorio');
    }

    // Obtener la plantilla
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error('La plantilla especificada no existe');
    }

    if (!template.isActive) {
      throw new Error('La plantilla especificada no está activa');
    }

    // Obtener datos del certificado
    const certificateRepository = getCertificateRepository();
    const certificate = await certificateRepository.findById(certificateId);
    if (!certificate) {
      throw new Error('El certificado especificado no existe');
    }

    // 5. Preparar datos dinámicos de firmantes
    let signer1Data = {};
    let signer2Data = {};

    if (certificate.metadata?.signer1Id) {
      try {
        const signerRepo = getSignerRepository();
        const signer = await signerRepo.findById(certificate.metadata.signer1Id);
        if (signer && signer.isActive) {
          signer1Data = {
            signer1_Name: signer.name,
            signer1_Title: signer.title,
            signer1_SignatureImage: signer.signatureUrl
          };
        }
      } catch (err) {
        console.warn('Error fetching signer 1:', err);
      }
    }

    if (certificate.metadata?.signer2Id) {
      try {
        const signerRepo = getSignerRepository();
        const signer = await signerRepo.findById(certificate.metadata.signer2Id);
        if (signer && signer.isActive) {
          signer2Data = {
            signer2_Name: signer.name,
            signer2_Title: signer.title,
            signer2_SignatureImage: signer.signatureUrl
          };
        }
      } catch (err) {
        console.warn('Error fetching signer 2:', err);
      }
    }

    // 6. Obtener nombres de Campus y Área
    let campusName = 'Campus Principal';
    if (certificate.campusId) {
      try {
        const campus = await getCampusRepository().findById(certificate.campusId);
        if (campus) campusName = campus.name;
      } catch (err) {
        console.warn('Error fetching campus name:', err);
      }
    }

    let academicAreaName = '';
    if (certificate.academicAreaId) {
      try {
        const area = await getAcademicAreaRepository().findById(certificate.academicAreaId);
        if (area) academicAreaName = area.name;
      } catch (err) {
        console.warn('Error fetching academic area name:', err);
      }
    }

    // 7. Obtener duración del programa
    let duration = '40 horas';
    if (certificate.academicProgram) {
      try {
        const programs = await getAcademicProgramRepository().findAll();
        const program = programs.find(p => p.name === certificate.academicProgram);
        if (program && program.durationHours) duration = `${program.durationHours} horas`;
      } catch (err) {
        console.warn('Error fetching program duration:', err);
      }
    }

    // Generar certificado usando el servicio
    const certificateData = {
      id: certificate.id,
      folio: certificate.folio || '',
      studentName: certificate.studentName || '',
      academicProgram: certificate.academicProgram || '',
      issueDate: certificate.issueDate || new Date(),
      campusName,
      academicAreaName,
      certificateType: certificate.type || '',
      duration,
      digitalSignature: '', // TODO: Obtener de la firma
      signatureDate: new Date().toISOString(), // TODO: Obtener de la firma
      ...signer1Data,
      ...signer2Data
    };

    const generatedCertificate = await this.certificateService.generateCertificate(
      template,
      certificateData,
      options,
      generatedBy
    );

    return generatedCertificate;
  }
}
