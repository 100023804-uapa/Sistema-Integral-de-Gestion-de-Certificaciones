import { StateHistory } from '@/lib/types/certificateState';
import { FirebaseCertificateStateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateStateRepository';

export class GetStateHistoryUseCase {
  constructor(private certificateStateRepository: FirebaseCertificateStateRepository) {}

  async execute(certificateId: string): Promise<StateHistory | null> {
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    return await this.certificateStateRepository.getStateHistory(certificateId);
  }

  async getStatesByUser(userId: string, state?: string): Promise<any[]> {
    if (!userId?.trim()) {
      throw new Error('El ID del usuario es obligatorio');
    }

    return await this.certificateStateRepository.getStatesByUser(userId, state as any);
  }
}
