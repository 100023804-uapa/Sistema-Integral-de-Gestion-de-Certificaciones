import { GeneratedCertificate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import {
  getAcademicAreaRepository,
  getAcademicProgramRepository,
  getCampusRepository,
  getCertificateRepository,
  getDigitalSignatureRepository,
  getSignerRepository,
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
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!templateId?.trim()) {
      throw new Error('El ID de la plantilla es obligatorio');
    }

    if (!generatedBy?.trim()) {
      throw new Error('El ID del usuario que genera es obligatorio');
    }

    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error('La plantilla especificada no existe');
    }

    if (!template.isActive) {
      throw new Error('La plantilla especificada no está activa');
    }

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

    let signer1Data = {};
    let signer2Data = {};

    if (certificate.metadata?.signer1Id) {
      try {
        const signer = await getSignerRepository().findById(certificate.metadata.signer1Id);
        if (signer && signer.isActive) {
          signer1Data = {
            signer1_Name: signer.name,
            signer1_Title: signer.title,
            signer1_SignatureImage: signer.signatureUrl,
          };
        }
      } catch (error) {
        console.warn('Error fetching signer 1:', error);
      }
    }

    if (certificate.metadata?.signer2Id) {
      try {
        const signer = await getSignerRepository().findById(certificate.metadata.signer2Id);
        if (signer && signer.isActive) {
          signer2Data = {
            signer2_Name: signer.name,
            signer2_Title: signer.title,
            signer2_SignatureImage: signer.signatureUrl,
          };
        }
      } catch (error) {
        console.warn('Error fetching signer 2:', error);
      }
    }

    let duration = '40 horas';
    if (certificate.academicProgram) {
      try {
        const programs = await getAcademicProgramRepository().findAll();
        const program = programs.find((item) => item.name === certificate.academicProgram);
        if (program?.durationHours) {
          duration = `${program.durationHours} horas`;
        }
      } catch (error) {
        console.warn('Error fetching program duration:', error);
      }
    }

    const signatureMarkup =
      options.includeSignature !== false &&
      signature?.signatureData?.signatureBase64
        ? `<img src="${signature.signatureData.signatureBase64}" alt="Firma digital" style="max-width: 220px; max-height: 96px;" />`
        : '';

    const certificateData = {
      id: certificate.id,
      folio: certificate.folio || '',
      studentName: certificate.studentName || '',
      academicProgram: certificate.academicProgram || '',
      issueDate: certificate.issueDate || new Date(),
      campusName: campus?.name || certificate.campusId || 'Recinto no especificado',
      academicAreaName: academicArea?.name || certificate.academicAreaId || '',
      certificateType: certificate.type || '',
      duration,
      digitalSignature: signatureMarkup,
      signatureDate: signature?.signedAt
        ? signature.signedAt.toISOString()
        : new Date().toISOString(),
      ...signer1Data,
      ...signer2Data,
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
