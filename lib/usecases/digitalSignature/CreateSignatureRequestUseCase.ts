import { SignatureRequest } from '@/lib/types/digitalSignature';
import { FirebaseDigitalSignatureRepository } from '@/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository';
import { getTransitionStateUseCase } from '@/lib/container';

export class CreateSignatureRequestUseCase {
  constructor(
    private signatureRepository: FirebaseDigitalSignatureRepository
  ) {}

  async execute(
    data: {
      certificateId: string;
      requestedTo: string;
      message?: string;
      expiresInHours?: number;
    },
    requestedBy: string
  ): Promise<SignatureRequest> {
    // Validaciones
    if (!data.certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    if (!data.requestedTo?.trim()) {
      throw new Error('El ID del firmante es obligatorio');
    }

    if (!requestedBy?.trim()) {
      throw new Error('El ID del solicitante es obligatorio');
    }

    // Verificar que el certificado esté en estado 'verified'
    const transitionStateUseCase = getTransitionStateUseCase();
    const availableTransitions = await transitionStateUseCase.getAvailableTransitions(
      data.certificateId,
      'coordinator' // TODO: Obtener rol del solicitante
    );

    const canRequestSignature = availableTransitions.some(
      transition => transition.to === 'pending_signature'
    );

    if (!canRequestSignature) {
      throw new Error('El certificado no está en un estado que permita solicitar firma');
    }

    // Verificar que no exista una solicitud de firma pendiente
    const existingRequest = await this.signatureRepository.getSignatureRequest(data.certificateId);
    if (existingRequest && existingRequest.status === 'pending') {
      throw new Error('Ya existe una solicitud de firma pendiente para este certificado');
    }

    // Crear la solicitud de firma
    const signatureRequest = await this.signatureRepository.createSignatureRequest(data, requestedBy);

    // Transicionar el certificado a 'pending_signature'
    await transitionStateUseCase.execute(
      data.certificateId,
      'pending_signature',
      requestedBy,
      'coordinator', // TODO: Obtener rol del solicitante
      'Solicitud de firma enviada'
    );

    return signatureRequest;
  }
}
