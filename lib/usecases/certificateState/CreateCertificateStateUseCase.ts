import { CertificateState, CertificateStateValue } from '@/lib/types/certificateState';
import { FirebaseCertificateStateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateStateRepository';
import { STATE_TRANSITIONS } from '@/lib/types/certificateState';

export class CreateCertificateStateUseCase {
  constructor(private certificateStateRepository: FirebaseCertificateStateRepository) {}

  async execute(
    certificateId: string, 
    initialState: CertificateStateValue = 'draft',
    changedBy: string
  ): Promise<CertificateState> {
    // Validaciones
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!changedBy?.trim()) {
      throw new Error('El ID del usuario que realiza el cambio es obligatorio');
    }

    // Verificar que no exista un estado previo
    const existingState = await this.certificateStateRepository.getCurrentState(certificateId);
    if (existingState) {
      throw new Error('El certificado ya tiene un estado asignado');
    }

    // Crear estado inicial
    const stateData: Omit<CertificateState, 'id'> = {
      certificateId,
      currentState: initialState,
      changedBy,
      changedAt: new Date(),
      comments: 'Estado inicial del certificado'
    };

    return await this.certificateStateRepository.create(stateData);
  }
}
