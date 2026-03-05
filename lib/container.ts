import { FirebaseAccessRepository, AccessUser, AccessRequest } from '@/lib/infrastructure/repositories/FirebaseAccessRepository';
import { FirebaseCertificateRepository, ProgramStat } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';
import { FirebaseStudentRepository } from './infrastructure/repositories/FirebaseStudentRepository';
import { FirebaseTemplateRepository } from './infrastructure/repositories/FirebaseTemplateRepository';
import { FirebaseCampusRepository } from './infrastructure/repositories/FirebaseCampusRepository';
import { FirebaseAcademicAreaRepository } from './infrastructure/repositories/FirebaseAcademicAreaRepository';
import { CreateCertificate } from './application/use-cases/CreateCertificate';
import { GenerateFolio } from './application/use-cases/GenerateFolio';
import { CreateCampusUseCase } from './usecases/campus/CreateCampusUseCase';
import { ListCampusesUseCase } from './usecases/campus/ListCampusesUseCase';
import { UpdateCampusUseCase } from './usecases/campus/UpdateCampusUseCase';
import { DeleteCampusUseCase } from './usecases/campus/DeleteCampusUseCase';
import { CreateAcademicAreaUseCase } from './usecases/academicArea/CreateAcademicAreaUseCase';
import { ListAcademicAreasUseCase } from './usecases/academicArea/ListAcademicAreasUseCase';
import { UpdateAcademicAreaUseCase } from './usecases/academicArea/UpdateAcademicAreaUseCase';
import { DeleteAcademicAreaUseCase } from './usecases/academicArea/DeleteAcademicAreaUseCase';
import { QueryDocumentSnapshot } from 'firebase/firestore';

// Re-exportar tipos para evitar imports de infraestructura en app/
export type { ProgramStat, AccessUser, AccessRequest, QueryDocumentSnapshot };
export type { Campus } from './types/campus';
export type { AcademicArea } from './types/academicArea';

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

export function getAcademicAreaRepository() {
    return new FirebaseAcademicAreaRepository();
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

// Academic Area Use Cases
export function getCreateAcademicAreaUseCase() {
    return new CreateAcademicAreaUseCase(getAcademicAreaRepository(), getCampusRepository());
}

export function getListAcademicAreasUseCase() {
    return new ListAcademicAreasUseCase(getAcademicAreaRepository());
}

export function getUpdateAcademicAreaUseCase() {
    return new UpdateAcademicAreaUseCase(getAcademicAreaRepository(), getCampusRepository());
}

export function getDeleteAcademicAreaUseCase() {
    return new DeleteAcademicAreaUseCase(getAcademicAreaRepository());
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
