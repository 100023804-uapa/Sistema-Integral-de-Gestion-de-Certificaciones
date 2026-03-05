import { SignatureRequest, DigitalSignature } from '@/lib/types/digitalSignature';
import { FirebaseDigitalSignatureRepository } from '@/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository';

export class GetSignatureRequestsUseCase {
  constructor(
    private signatureRepository: FirebaseDigitalSignatureRepository
  ) {}

  async getRequestsBySigner(signerId: string, status?: string): Promise<SignatureRequest[]> {
    if (!signerId?.trim()) {
      throw new Error('El ID del firmante es obligatorio');
    }

    return await this.signatureRepository.getSignatureRequestsBySigner(
      signerId, 
      status as any
    );
  }

  async getRequestsByRequester(requestedBy: string): Promise<SignatureRequest[]> {
    if (!requestedBy?.trim()) {
      throw new Error('El ID del solicitante es obligatorio');
    }

    return await this.signatureRepository.getSignatureRequestsByRequester(requestedBy);
  }

  async getRequestByCertificate(certificateId: string): Promise<SignatureRequest | null> {
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    return await this.signatureRepository.getSignatureRequest(certificateId);
  }

  async getSignatureByCertificate(certificateId: string): Promise<DigitalSignature | null> {
    if (!certificateId?.trim()) {
      throw new Error('El ID del certificado es obligatorio');
    }

    return await this.signatureRepository.getSignatureByCertificate(certificateId);
  }

  async getSignaturesBySigner(signerId: string): Promise<DigitalSignature[]> {
    if (!signerId?.trim()) {
      throw new Error('El ID del firmante es obligatorio');
    }

    return await this.signatureRepository.getSignaturesBySigner(signerId);
  }
}
