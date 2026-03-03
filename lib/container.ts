import { FirebaseAccessRepository } from '@/lib/infrastructure/repositories/FirebaseAccessRepository';
import { FirebaseCertificateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';
import { FirebaseStudentRepository } from '@/lib/infrastructure/repositories/FirebaseStudentRepository';
import { FirebaseTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseTemplateRepository';

import { CreateCertificate } from '@/lib/application/use-cases/CreateCertificate';
import { GenerateFolio } from '@/lib/application/use-cases/GenerateFolio';

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

export function getGenerateFolioUseCase() {
    return new GenerateFolio(getCertificateRepository());
}

export function getCreateCertificateUseCase() {
    const certificateRepository = getCertificateRepository();
    const studentRepository = getStudentRepository();
    const generateFolio = new GenerateFolio(certificateRepository);

    return new CreateCertificate(certificateRepository, studentRepository, generateFolio);
}
