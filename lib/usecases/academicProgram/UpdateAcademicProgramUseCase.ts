import { AcademicProgram, UpdateAcademicProgramRequest } from '@/lib/types/academicProgram';
import { FirebaseAcademicProgramRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicProgramRepository';

export class UpdateAcademicProgramUseCase {
    constructor(private programRepository: FirebaseAcademicProgramRepository) { }

    async execute(id: string, data: UpdateAcademicProgramRequest): Promise<AcademicProgram> {
        if (!id?.trim()) {
            throw new Error('El ID del programa es obligatorio');
        }

        const existing = await this.programRepository.findById(id);
        if (!existing) {
            throw new Error('El programa académico no existe');
        }

        // Si se cambia el código, verificar que no esté duplicado
        if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
            const all = await this.programRepository.findAll();
            const codeExists = all.some(
                p => p.id !== id && p.code.toLowerCase() === data.code!.toLowerCase() && p.isActive
            );
            if (codeExists) {
                throw new Error('Ya existe un programa académico con ese código');
            }
        }

        return await this.programRepository.update(id, data);
    }
}
