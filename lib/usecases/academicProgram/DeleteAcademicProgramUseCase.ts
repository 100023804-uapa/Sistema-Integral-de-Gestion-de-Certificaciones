import { FirebaseAcademicProgramRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicProgramRepository';

export class DeleteAcademicProgramUseCase {
    constructor(private programRepository: FirebaseAcademicProgramRepository) { }

    async execute(id: string): Promise<void> {
        if (!id?.trim()) {
            throw new Error('El ID del programa es obligatorio');
        }

        const existing = await this.programRepository.findById(id);
        if (!existing) {
            throw new Error('El programa académico no existe');
        }

        // Soft delete
        await this.programRepository.delete(id);
    }
}
