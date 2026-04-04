import { DigitalSignature } from '@/lib/types/digitalSignature';
import { FirebaseDigitalSignatureRepository } from '@/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository';
import { getTransitionStateUseCase } from '@/lib/container';

export class SignCertificateUseCase {
  constructor(
    private signatureRepository: FirebaseDigitalSignatureRepository
  ) {}

  async execute(
    data: {
      certificateId: string;
      comments?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: {
        latitude: number;
        longitude: number;
      };
    },
    signerId: string,
    signerRole = 'administrator'
  ): Promise<DigitalSignature> {
    // Validaciones
    if (!data.certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!signerId?.trim()) {
      throw new Error('El ID del firmante es obligatorio');
    }

    // Verificar que exista una solicitud de firma pendiente
    const signatureRequest = await this.signatureRepository.getSignatureRequest(data.certificateId);
    if (!signatureRequest) {
      throw new Error('No existe una solicitud de firma para este certificado');
    }

    if (signatureRequest.status !== 'pending') {
      throw new Error('La solicitud de firma no está pendiente');
    }

    if (signatureRequest.requestedTo !== signerId) {
      throw new Error('No estás autorizado para firmar este certificado');
    }

    // Verificar que no haya expirado
    if (signatureRequest.expiresAt < new Date()) {
      throw new Error('La solicitud de firma ha expirado');
    }

    // Crear la firma digital
    const signature = await this.signatureRepository.createSignature({
      certificateId: data.certificateId,
      signatureData: {
        comments: data.comments,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location
      },
      signerId
    });

    // Transicionar el certificado a 'signed'
    const transitionStateUseCase = getTransitionStateUseCase();
    await transitionStateUseCase.execute(
      data.certificateId,
      'signed',
      signerId,
      signerRole,
      data.comments || 'Certificado aprobado por usuario interno autorizado',
      {
        signerId,
        signatureId: signature.id,
      }
    );

    return signature;
  }
}
