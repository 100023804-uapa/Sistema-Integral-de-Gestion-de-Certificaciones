import { ISignerRepository } from '../../domain/repositories/ISignerRepository';
import { Signer } from '../../types/signer';

export class ListSignersUseCase {
    constructor(private signerRepository: ISignerRepository) { }

    async execute(includeInactive: boolean = false): Promise<Signer[]> {
        return await this.signerRepository.findAll(includeInactive);
    }
}
