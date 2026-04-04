import { FirebaseDigitalSignatureRepository } from '@/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository';
import { getCertificateStateRepository, getTransitionStateUseCase } from '@/lib/container';

export class RejectSignatureUseCase {
  constructor(
    private signatureRepository: FirebaseDigitalSignatureRepository
  ) {}

  async execute(
    certificateId: string,
    rejectionReason: string,
    signerId: string,
    signerRole = 'administrator'
  ): Promise<void> {
    // Validaciones
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!rejectionReason?.trim()) {
      throw new Error('La razón del rechazo es obligatoria');
    }

    if (!signerId?.trim()) {
      throw new Error('El ID del firmante es obligatorio');
    }

    // Verificar que exista una solicitud de firma pendiente
    const signatureRequest = await this.signatureRepository.getSignatureRequest(certificateId);
    if (!signatureRequest) {
      throw new Error('No existe una solicitud de firma para este certificado');
    }

    if (
      signatureRequest.status !== 'pending' &&
      signatureRequest.status !== 'rejected'
    ) {
      throw new Error('La solicitud de firma no está pendiente');
    }

    if (signatureRequest.requestedTo !== signerId) {
      throw new Error('No estás autorizado para rechazar esta solicitud de firma');
    }

    const currentState = await getCertificateStateRepository().getCurrentState(certificateId);
    if (!currentState) {
      throw new Error('El certificado no tiene un estado de workflow actual');
    }

    if (currentState.currentState === 'pending_signature') {
      // Transicionar el certificado de vuelta a 'verified'
      const transitionStateUseCase = getTransitionStateUseCase();
      await transitionStateUseCase.execute(
        certificateId,
        'verified',
        signerId,
        signerRole,
        `Firma rechazada: ${rejectionReason}`,
        {
          signerId,
          rejectionReason,
        }
      );
    }

    await this.signatureRepository.updateSignatureRequestStatus(certificateId, 'rejected', {
      rejectionReason,
    });
  }
}
