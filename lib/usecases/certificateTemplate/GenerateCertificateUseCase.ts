import { GeneratedCertificate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import {
  getAcademicAreaRepository,
  getCampusRepository,
  getCertificateRepository,
  getDigitalSignatureRepository,
  getTransitionStateUseCase,
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
    generatedBy: string,
    generatedByRole = 'administrator'
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

    const transitionStateUseCase = getTransitionStateUseCase();
    const availableTransitions = await transitionStateUseCase.getAvailableTransitions(
      certificateId,
      generatedByRole
    );

    if (!availableTransitions.some((transition) => transition.to === 'issued')) {
      throw new Error('El certificado no está listo para ser emitido');
    }

    const [campus, academicArea, signature] = await Promise.all([
      certificate.campusId
        ? getCampusRepository().findById(certificate.campusId)
        : Promise.resolve(null),
      certificate.academicAreaId
        ? getAcademicAreaRepository().findById(certificate.academicAreaId)
        : Promise.resolve(null),
      getDigitalSignatureRepository().getSignatureByCertificate(certificateId),
    ]);

    const signatureMarkup =
      options.includeSignature !== false &&
      signature?.signatureData?.signatureBase64
        ? `<img src="${signature.signatureData.signatureBase64}" alt="Firma digital" style="max-width: 220px; max-height: 96px;" />`
        : '';

    // Generar certificado usando el servicio
    const certificateData = {
      id: certificate.id,
      folio: certificate.folio || '',
      studentName: certificate.studentName || '',
      academicProgram: certificate.academicProgram || '',
      issueDate: certificate.issueDate || new Date(),
      campusName: campus?.name || certificate.campusId || 'Recinto no especificado',
      academicAreaName:
        academicArea?.name || certificate.academicAreaId || '',
      certificateType: certificate.type || '',
      duration: '40 horas', // TODO: Calcular según programa
      digitalSignature: signatureMarkup,
      signatureDate: signature?.signedAt
        ? signature.signedAt.toISOString()
        : new Date().toISOString(),
    };

    const generatedCertificate = await this.certificateService.generateCertificate(
      template,
      certificateData,
      options,
      generatedBy
    );

    await certificateRepository.updateGeneratedAssets(certificateId, {
      pdfUrl: generatedCertificate.pdfUrl,
      qrCodeUrl: generatedCertificate.qrCodeUrl,
      templateId,
    });

    await transitionStateUseCase.execute(
      certificateId,
      'issued',
      generatedBy,
      generatedByRole,
      'Certificado emitido y PDF final generado',
      {
        pdfUrl: generatedCertificate.pdfUrl,
        qrCodeUrl: generatedCertificate.qrCodeUrl,
        templateId,
      }
    );

    return generatedCertificate;
  }
}
