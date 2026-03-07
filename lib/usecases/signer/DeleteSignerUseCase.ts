import { ISignerRepository } from '../../domain/repositories/ISignerRepository';

export class DeleteSignerUseCase {
    constructor(private signerRepository: ISignerRepository) { }

    async execute(id: string): Promise<void> {
        if (!id) throw new Error("Se requiere el ID del firmante para dar de baja.");
        await this.signerRepository.delete(id);
    }
}
