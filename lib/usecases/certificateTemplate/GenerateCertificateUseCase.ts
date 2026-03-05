import { GeneratedCertificate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import { getCertificateRepository } from '@/lib/container';
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

    // Generar certificado usando el servicio
    const certificateData = {
      id: certificate.id,
      folio: certificate.folio || '',
      studentName: certificate.studentName || '',
      academicProgram: certificate.academicProgram || '',
      issueDate: certificate.issueDate || new Date(),
      campusName: 'Campus Principal', // TODO: Obtener del campusId
      academicAreaName: '', // TODO: Obtener del academicAreaId
      certificateType: certificate.type || '',
      duration: '40 horas', // TODO: Calcular según programa
      digitalSignature: '', // TODO: Obtener de la firma
      signatureDate: new Date().toISOString() // TODO: Obtener de la firma
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
