import { ISignerRepository } from '../../domain/repositories/ISignerRepository';
import { Signer, CreateSignerRequest } from '../../types/signer';

export class CreateSignerUseCase {
    constructor(private signerRepository: ISignerRepository) { }

    async execute(request: CreateSignerRequest): Promise<Signer> {
        if (!request.name || !request.title) {
            throw new Error('El nombre y el cargo son requeridos para registrar un firmante.');
        }
        return await this.signerRepository.create(request);
    }
}
