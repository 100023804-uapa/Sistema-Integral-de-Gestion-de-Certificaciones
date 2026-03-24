import { ISignerRepository } from '../../domain/repositories/ISignerRepository';
import { Signer, UpdateSignerRequest } from '../../types/signer';

export class UpdateSignerUseCase {
    constructor(private signerRepository: ISignerRepository) { }

    async execute(id: string, updates: UpdateSignerRequest): Promise<Signer> {
        if (!id) throw new Error("Se requiere el ID del firmante para actualizar.");
        return await this.signerRepository.update(id, updates);
    }
}
