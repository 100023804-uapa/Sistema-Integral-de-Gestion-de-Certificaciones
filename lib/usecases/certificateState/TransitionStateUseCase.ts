import {
  CertificateState,
  CertificateStateValue,
  StateTransition,
} from '@/lib/types/certificateState';
import { FirebaseCertificateStateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateStateRepository';
import { STATE_TRANSITIONS } from '@/lib/types/certificateState';
import { getCertificateRepository, getDigitalSignatureRepository } from '@/lib/container';

export class TransitionStateUseCase {
  constructor(private certificateStateRepository: FirebaseCertificateStateRepository) {}

  async execute(
    certificateId: string,
    newState: CertificateStateValue,
    changedBy: string,
    userRole: string,
    comments?: string,
    metadata?: Record<string, unknown>
  ): Promise<CertificateState> {
    // Validaciones
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!newState) {
      throw new Error('El nuevo estado es obligatorio');
    }

    if (!changedBy?.trim()) {
      throw new Error('El ID del usuario que realiza el cambio es obligatorio');
    }

    // Obtener estado actual
    const currentState = await this.certificateStateRepository.getCurrentState(certificateId);
    if (!currentState) {
      throw new Error('El certificado no tiene un estado actual');
    }

    // Verificar que la transición sea válida
    const transition = STATE_TRANSITIONS.find(
      t => t.from === currentState.currentState && t.to === newState
    );

    if (!transition) {
      throw new Error(`Transición no válida: de ${currentState.currentState} a ${newState}`);
    }

    // Verificar que el usuario tenga permiso para esta transición
    if (!transition.allowedRoles.includes(userRole)) {
      throw new Error(`El rol ${userRole} no está autorizado para realizar esta transición`);
    }

    await this.assertTransitionPrerequisites(certificateId, newState, metadata);

    // Ejecutar la transición
    const nextState = await this.certificateStateRepository.transitionState(
      certificateId,
      newState,
      changedBy,
      comments,
      {
        ...(metadata || {}),
        actorRole: userRole,
        from: currentState.currentState,
        to: newState,
        previousChangedBy: currentState.changedBy,
      }
    );

    return nextState;
  }

  async getAvailableTransitions(
    certificateId: string,
    userRole: string
  ): Promise<any[]> {
    const currentState = await this.certificateStateRepository.getCurrentState(certificateId);
    
    if (!currentState) {
      return [];
    }

    return STATE_TRANSITIONS.filter(
      transition => 
        transition.from === currentState.currentState && 
        transition.allowedRoles.includes(userRole)
    );
  }

  async getAvailableManualTransitions(
    certificateId: string,
    userRole: string
  ): Promise<StateTransition[]> {
    const transitions = await this.getAvailableTransitions(certificateId, userRole);

    return transitions.filter(
      (transition) =>
        !transition.flow ||
        transition.flow === 'direct' ||
        transition.flow === 'signature_request' ||
        transition.flow === 'generation'
    );
  }

  async getPendingActions(userRole: string): Promise<CertificateState[]> {
    return await this.certificateStateRepository.getPendingActions(userRole);
  }

  private async assertTransitionPrerequisites(
    certificateId: string,
    newState: CertificateStateValue,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (newState === 'pending_signature') {
      const request = await getDigitalSignatureRepository().getSignatureRequest(certificateId);

      if (!request || request.status !== 'pending') {
        throw new Error('Debe existir una solicitud de firma pendiente antes de enviar a firma');
      }

      if (
        typeof metadata?.signatureRequestId === 'string' &&
        metadata.signatureRequestId !== request.id
      ) {
        throw new Error('La solicitud de firma asociada no coincide con el certificado');
      }
    }

    if (newState === 'signed') {
      const signature = await getDigitalSignatureRepository().getSignatureByCertificate(certificateId);

      if (!signature || signature.status !== 'signed') {
        throw new Error('Debe existir una firma digital registrada antes de marcar el certificado como firmado');
      }
    }

    if (newState === 'issued') {
      const certificate = await getCertificateRepository().findById(certificateId);

      if (!certificate?.pdfUrl) {
        throw new Error('Debe generarse el PDF final antes de emitir el certificado');
      }
    }
  }

}
