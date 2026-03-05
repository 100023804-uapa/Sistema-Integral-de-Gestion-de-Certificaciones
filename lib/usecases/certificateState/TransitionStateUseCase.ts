import { CertificateState, CertificateStateValue } from '@/lib/types/certificateState';
import { FirebaseCertificateStateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateStateRepository';
import { STATE_TRANSITIONS } from '@/lib/types/certificateState';

export class TransitionStateUseCase {
  constructor(private certificateStateRepository: FirebaseCertificateStateRepository) {}

  async execute(
    certificateId: string,
    newState: CertificateStateValue,
    changedBy: string,
    userRole: string,
    comments?: string
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

    // Ejecutar la transición
    return await this.certificateStateRepository.transitionState(
      certificateId,
      newState,
      changedBy,
      comments
    );
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

  async getPendingActions(userRole: string): Promise<CertificateState[]> {
    return await this.certificateStateRepository.getPendingActions(userRole);
  }
}
