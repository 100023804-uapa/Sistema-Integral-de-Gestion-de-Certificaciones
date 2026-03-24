import { AcademicProgram, CreateAcademicProgramRequest } from '@/lib/types/academicProgram';
import { FirebaseAcademicProgramRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicProgramRepository';

export class CreateAcademicProgramUseCase {
    constructor(private programRepository: FirebaseAcademicProgramRepository) { }

    async execute(data: CreateAcademicProgramRequest): Promise<AcademicProgram> {
        if (!data.name?.trim()) {
            throw new Error('El nombre del programa es obligatorio');
        }

        if (!data.code?.trim()) {
            throw new Error('El código del programa es obligatorio');
        }

        // Verificar que el código no esté duplicado
        const all = await this.programRepository.findAll();
        const codeExists = all.some(
            p => p.code.toLowerCase() === data.code.toLowerCase() && p.isActive
        );
        if (codeExists) {
            throw new Error('Ya existe un programa académico con ese código');
        }

        return await this.programRepository.create(data);
    }
}
