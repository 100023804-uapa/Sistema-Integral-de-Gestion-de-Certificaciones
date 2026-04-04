import { DigitalSignature } from '@/lib/types/digitalSignature';
import { FirebaseDigitalSignatureRepository } from '@/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository';
import { getCertificateStateRepository, getTransitionStateUseCase } from '@/lib/container';

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

    const certificateStateRepository = getCertificateStateRepository();

    // Verificar que exista una solicitud de firma asociada
    const signatureRequest = await this.signatureRepository.getSignatureRequest(data.certificateId);
    if (!signatureRequest) {
      throw new Error('No existe una solicitud de firma para este certificado');
    }

    if (signatureRequest.requestedTo !== signerId) {
      throw new Error('No estás autorizado para firmar este certificado');
    }

    if (
      signatureRequest.status !== 'pending' &&
      signatureRequest.status !== 'signed'
    ) {
      throw new Error('La solicitud de firma no está pendiente');
    }

    const currentState = await certificateStateRepository.getCurrentState(data.certificateId);
    if (!currentState) {
      throw new Error('El certificado no tiene un estado de workflow actual');
    }

    const existingSignature = await this.signatureRepository.getSignatureByCertificate(
      data.certificateId
    );

    // Verificar que no haya expirado
    if (
      signatureRequest.status === 'pending' &&
      signatureRequest.expiresAt < new Date()
    ) {
      throw new Error('La solicitud de firma ha expirado');
    }

    let signature = existingSignature;

    if (!signature || signature.status !== 'signed') {
      signature = await this.signatureRepository.createSignature({
        certificateId: data.certificateId,
        signatureData: {
          comments: data.comments,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location
        },
        signerId
      });
    }

    const alreadySigned =
      currentState.currentState === 'signed' ||
      currentState.currentState === 'issued' ||
      currentState.currentState === 'available';

    if (!alreadySigned) {
      if (currentState.currentState !== 'pending_signature') {
        throw new Error(
          `El certificado no puede firmarse desde el estado ${currentState.currentState}`
        );
      }

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
    }

    await this.signatureRepository.updateSignatureRequestStatus(
      data.certificateId,
      'signed'
    );

    return signature;
  }
}
