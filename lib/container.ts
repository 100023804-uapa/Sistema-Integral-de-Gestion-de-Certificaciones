import { FirebaseAccessRepository, AccessUser, AccessRequest } from '@/lib/infrastructure/repositories/FirebaseAccessRepository';
import { FirebaseCertificateRepository, ProgramStat } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';
import { FirebaseStudentRepository } from './infrastructure/repositories/FirebaseStudentRepository';
import { FirebaseTemplateRepository } from './infrastructure/repositories/FirebaseTemplateRepository';
import { FirebaseCampusRepository } from './infrastructure/repositories/FirebaseCampusRepository';
import { CreateCertificate } from './application/use-cases/CreateCertificate';
import { GenerateFolio } from './application/use-cases/GenerateFolio';
import { CreateCampusUseCase } from './usecases/campus/CreateCampusUseCase';
import { ListCampusesUseCase } from './usecases/campus/ListCampusesUseCase';
import { UpdateCampusUseCase } from './usecases/campus/UpdateCampusUseCase';
import { DeleteCampusUseCase } from './usecases/campus/DeleteCampusUseCase';
import { QueryDocumentSnapshot } from 'firebase/firestore';

// Re-exportar tipos para evitar imports de infraestructura en app/
export type { ProgramStat, AccessUser, AccessRequest, QueryDocumentSnapshot };
export type { Campus } from './types/campus';

export function getAccessRepository() {
    return new FirebaseAccessRepository();
}

export function getCertificateRepository() {
    return new FirebaseCertificateRepository();
}

export function getStudentRepository() {
    return new FirebaseStudentRepository();
}

export function getTemplateRepository() {
    return new FirebaseTemplateRepository();
}

export function getCampusRepository() {
    return new FirebaseCampusRepository();
}

// Campus Use Cases
export function getCreateCampusUseCase() {
    return new CreateCampusUseCase(getCampusRepository());
}

export function getListCampusesUseCase() {
    return new ListCampusesUseCase(getCampusRepository());
}

export function getUpdateCampusUseCase() {
    return new UpdateCampusUseCase(getCampusRepository());
}

export function getDeleteCampusUseCase() {
    return new DeleteCampusUseCase(getCampusRepository());
}

export function getGenerateFolioUseCase() {
    return new GenerateFolio(getCertificateRepository());
}

export function getCreateCertificateUseCase() {
    const certificateRepository = getCertificateRepository();
    const studentRepository = getStudentRepository();
    const generateFolio = new GenerateFolio(certificateRepository);

    return new CreateCertificate(certificateRepository, studentRepository, generateFolio);
}
