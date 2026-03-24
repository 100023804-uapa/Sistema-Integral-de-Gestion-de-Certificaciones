import { AcademicProgram } from '@/lib/types/academicProgram';
import { FirebaseAcademicProgramRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicProgramRepository';

export class ListAcademicProgramsUseCase {
    constructor(private programRepository: FirebaseAcademicProgramRepository) { }

    async execute(onlyActive = false): Promise<AcademicProgram[]> {
        if (onlyActive) {
            return await this.programRepository.findActive();
        }
        return await this.programRepository.findAll();
    }
}
