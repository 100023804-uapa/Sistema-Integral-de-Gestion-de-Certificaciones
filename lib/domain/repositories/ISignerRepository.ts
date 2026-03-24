import { Signer, CreateSignerRequest, UpdateSignerRequest } from '../../types/signer';

export interface ISignerRepository {
    create(signer: CreateSignerRequest): Promise<Signer>;
    findById(id: string): Promise<Signer | null>;
    findAll(includeInactive?: boolean): Promise<Signer[]>;
    update(id: string, updates: UpdateSignerRequest): Promise<Signer>;
    delete(id: string): Promise<void>;
}
