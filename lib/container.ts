import { FirebaseAccessRepository, AccessUser, AccessRequest } from '@/lib/infrastructure/repositories/FirebaseAccessRepository';
import { FirebaseCertificateRepository, ProgramStat } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';
import { FirebaseStudentRepository } from '@/lib/infrastructure/repositories/FirebaseStudentRepository';
import { FirebaseStudentCertificateRepository } from '@/lib/infrastructure/repositories/FirebaseStudentCertificateRepository';
import { FirebaseCampusRepository } from './infrastructure/repositories/FirebaseCampusRepository';
import { FirebaseAcademicAreaRepository } from './infrastructure/repositories/FirebaseAcademicAreaRepository';
import { FirebaseCertificateTypeRepository } from './infrastructure/repositories/FirebaseCertificateTypeRepository';
import { FirebaseRoleRepository } from './infrastructure/repositories/FirebaseRoleRepository';
import { FirebaseCertificateStateRepository } from './infrastructure/repositories/FirebaseCertificateStateRepository';
import { FirebaseDigitalSignatureRepository } from './infrastructure/repositories/FirebaseDigitalSignatureRepository';
import { FirebaseCertificateTemplateRepository } from './infrastructure/repositories/FirebaseCertificateTemplateRepository';
import { FirebaseAcademicProgramRepository } from './infrastructure/repositories/FirebaseAcademicProgramRepository';
import { FirebaseSignerRepository } from './infrastructure/repositories/FirebaseSignerRepository';
import { QueryDocumentSnapshot } from 'firebase/firestore';

// Use Cases existentes
import { CreateCertificate } from './application/use-cases/CreateCertificate';
import { CreateCampusUseCase } from './usecases/campus/CreateCampusUseCase';
import { ListCampusesUseCase } from './usecases/campus/ListCampusesUseCase';
import { UpdateCampusUseCase } from './usecases/campus/UpdateCampusUseCase';
import { DeleteCampusUseCase } from './usecases/campus/DeleteCampusUseCase';
import { CreateAcademicAreaUseCase } from './usecases/academicArea/CreateAcademicAreaUseCase';
import { ListAcademicAreasUseCase } from './usecases/academicArea/ListAcademicAreasUseCase';
import { UpdateAcademicAreaUseCase } from './usecases/academicArea/UpdateAcademicAreaUseCase';
import { DeleteAcademicAreaUseCase } from './usecases/academicArea/DeleteAcademicAreaUseCase';
import { CreateCertificateTypeUseCase } from './usecases/certificateType/CreateCertificateTypeUseCase';
import { ListCertificateTypesUseCase } from './usecases/certificateType/ListCertificateTypesUseCase';
import { UpdateCertificateTypeUseCase } from './usecases/certificateType/UpdateCertificateTypeUseCase';
import { DeleteCertificateTypeUseCase } from './usecases/certificateType/DeleteCertificateTypeUseCase';
import { CreateRoleUseCase } from './usecases/role/CreateRoleUseCase';
import { ListRolesUseCase } from './usecases/role/ListRolesUseCase';
import { UpdateRoleUseCase } from './usecases/role/UpdateRoleUseCase';
import { DeleteRoleUseCase } from './usecases/role/DeleteRoleUseCase';
import { AssignRoleUseCase } from './usecases/role/AssignRoleUseCase';
import { CreateCertificateStateUseCase } from './usecases/certificateState/CreateCertificateStateUseCase';
import { TransitionStateUseCase } from './usecases/certificateState/TransitionStateUseCase';
import { GetStateHistoryUseCase } from './usecases/certificateState/GetStateHistoryUseCase';
import { CreateSignatureRequestUseCase } from './usecases/digitalSignature/CreateSignatureRequestUseCase';
import { SignCertificateUseCase } from './usecases/digitalSignature/SignCertificateUseCase';
import { RejectSignatureUseCase } from './usecases/digitalSignature/RejectSignatureUseCase';
import { GetSignatureRequestsUseCase } from './usecases/digitalSignature/GetSignatureRequestsUseCase';
import { CreateTemplateUseCase } from './usecases/certificateTemplate/CreateTemplateUseCase';
import { ListTemplatesUseCase } from './usecases/certificateTemplate/ListTemplatesUseCase';
import { UpdateTemplateUseCase } from './usecases/certificateTemplate/UpdateTemplateUseCase';
import { DeleteTemplateUseCase } from './usecases/certificateTemplate/DeleteTemplateUseCase';
import { GenerateCertificateUseCase } from './usecases/certificateTemplate/GenerateCertificateUseCase';
import { GenerateFolio } from './application/use-cases/GenerateFolio';

// Use Cases nuevos para Estudiantes (US-12)
import { GetStudentCertificatesUseCase } from './usecases/student/GetStudentCertificatesUseCase';
import { GetCertificateDetailsUseCase } from './usecases/student/GetCertificateDetailsUseCase';
import { DownloadCertificateUseCase } from './usecases/student/DownloadCertificateUseCase';
import { CreateAcademicProgramUseCase } from './usecases/academicProgram/CreateAcademicProgramUseCase';
import { ListAcademicProgramsUseCase } from './usecases/academicProgram/ListAcademicProgramsUseCase';
import { UpdateAcademicProgramUseCase } from './usecases/academicProgram/UpdateAcademicProgramUseCase';
import { DeleteAcademicProgramUseCase } from './usecases/academicProgram/DeleteAcademicProgramUseCase';

// Use Cases para Firmantes
import { CreateSignerUseCase } from './usecases/signer/CreateSignerUseCase';
import { ListSignersUseCase } from './usecases/signer/ListSignersUseCase';
import { UpdateSignerUseCase } from './usecases/signer/UpdateSignerUseCase';
import { DeleteSignerUseCase } from './usecases/signer/DeleteSignerUseCase';

// Re-exportar tipos para evitar imports de infraestructura en app/
export type { ProgramStat, AccessUser, AccessRequest, QueryDocumentSnapshot };
export type { Campus } from './types/campus';
export type { AcademicArea } from './types/academicArea';
export type { CertificateType } from './types/certificateType';
export type { Role, UserRole, RoleValue } from './types/role';
export type { CertificateState, CertificateStateValue, StateHistory, StateTransition } from './types/certificateState';
export type { DigitalSignature, SignatureRequest, SignatureTemplate, SignatureStatus } from './types/digitalSignature';
export type { CertificateTemplate, GeneratedCertificate, TemplateType } from './types/certificateTemplate';
export type { AcademicProgram } from './types/academicProgram';
export type { Signer } from './types/signer';

// Repositorios
export function getAccessRepository() {
    return new FirebaseAccessRepository();
}

export function getCertificateRepository() {
    return new FirebaseCertificateRepository();
}

export function getStudentRepository() {
    return new FirebaseStudentRepository();
}

export function getStudentCertificateRepository() {
    return new FirebaseStudentCertificateRepository();
}

export function getCertificateTemplateRepository() {
    return new FirebaseCertificateTemplateRepository();
}

export const getTemplateRepository = getCertificateTemplateRepository;

export function getCampusRepository() {
    return new FirebaseCampusRepository();
}

export function getAcademicAreaRepository() {
    return new FirebaseAcademicAreaRepository();
}

export function getCertificateTypeRepository() {
    return new FirebaseCertificateTypeRepository();
}

export function getRoleRepository() {
    return new FirebaseRoleRepository();
}

export function getCertificateStateRepository() {
    return new FirebaseCertificateStateRepository();
}

export function getDigitalSignatureRepository() {
    return new FirebaseDigitalSignatureRepository();
}

export function getAcademicProgramRepository() {
    return new FirebaseAcademicProgramRepository();
}

export function getSignerRepository() {
    return new FirebaseSignerRepository();
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

// Academic Program Use Cases
export function getCreateAcademicProgramUseCase() {
    return new CreateAcademicProgramUseCase(getAcademicProgramRepository());
}

// Signer Use Cases
export function getCreateSignerUseCase() {
    return new CreateSignerUseCase(getSignerRepository());
}

export function getListSignersUseCase() {
    return new ListSignersUseCase(getSignerRepository());
}

export function getUpdateSignerUseCase() {
    return new UpdateSignerUseCase(getSignerRepository());
}

export function getDeleteSignerUseCase() {
    return new DeleteSignerUseCase(getSignerRepository());
}

export function getListAcademicProgramsUseCase() {
    return new ListAcademicProgramsUseCase(getAcademicProgramRepository());
}

export function getUpdateAcademicProgramUseCase() {
    return new UpdateAcademicProgramUseCase(getAcademicProgramRepository());
}

export function getDeleteAcademicProgramUseCase() {
    return new DeleteAcademicProgramUseCase(getAcademicProgramRepository());
}

// Certificate Type Use Cases
export function getCreateCertificateTypeUseCase() {
    return new CreateCertificateTypeUseCase(getCertificateTypeRepository());
}

export function getListCertificateTypesUseCase() {
    return new ListCertificateTypesUseCase(getCertificateTypeRepository());
}

export function getUpdateCertificateTypeUseCase() {
    return new UpdateCertificateTypeUseCase(getCertificateTypeRepository());
}

export function getDeleteCertificateTypeUseCase() {
    return new DeleteCertificateTypeUseCase(getCertificateTypeRepository());
}

// Role Use Cases
export function getCreateRoleUseCase() {
    return new CreateRoleUseCase(getRoleRepository());
}

export function getListRolesUseCase() {
    return new ListRolesUseCase(getRoleRepository());
}

export function getUpdateRoleUseCase() {
    return new UpdateRoleUseCase(getRoleRepository());
}

export function getDeleteRoleUseCase() {
    return new DeleteRoleUseCase(getRoleRepository());
}

export function getAssignRoleUseCase() {
    return new AssignRoleUseCase(getRoleRepository());
}

// Certificate State Use Cases
export function getCreateCertificateStateUseCase() {
    return new CreateCertificateStateUseCase(getCertificateStateRepository());
}

export function getTransitionStateUseCase() {
    return new TransitionStateUseCase(getCertificateStateRepository());
}

export function getGetStateHistoryUseCase() {
    return new GetStateHistoryUseCase(getCertificateStateRepository());
}

// Digital Signature Use Cases
export function getCreateSignatureRequestUseCase() {
    return new CreateSignatureRequestUseCase(getDigitalSignatureRepository());
}

export function getSignCertificateUseCase() {
    return new SignCertificateUseCase(getDigitalSignatureRepository());
}

export function getRejectSignatureUseCase() {
    return new RejectSignatureUseCase(getDigitalSignatureRepository());
}

export function getGetSignatureRequestsUseCase() {
    return new GetSignatureRequestsUseCase(getDigitalSignatureRepository());
}

// Certificate Template Use Cases
export function getCreateTemplateUseCase() {
    return new CreateTemplateUseCase(getCertificateTemplateRepository());
}

export function getListTemplatesUseCase() {
    return new ListTemplatesUseCase(getCertificateTemplateRepository());
}

export function getUpdateTemplateUseCase() {
    return new UpdateTemplateUseCase(getCertificateTemplateRepository());
}

export function getDeleteTemplateUseCase() {
    return new DeleteTemplateUseCase(getCertificateTemplateRepository());
}

export function getGenerateCertificateUseCase() {
    return new GenerateCertificateUseCase(getCertificateTemplateRepository());
}

export function getGenerateFolioUseCase() {
    return new GenerateFolio(getCertificateRepository());
}

// Certificate Use Cases
export function getCreateCertificateUseCase() {
    const certificateRepository = getCertificateRepository();
    const studentRepository = getStudentRepository();
    const campusRepository = getCampusRepository();
    const academicAreaRepository = getAcademicAreaRepository();
    const signerRepository = getSignerRepository();
    const templateRepository = getCertificateTemplateRepository();
    const generateFolio = new GenerateFolio(certificateRepository);

    return new CreateCertificate(
        certificateRepository,
        studentRepository,
        generateFolio,
        campusRepository,
        academicAreaRepository,
        signerRepository,
        templateRepository
    );
}

// Use Cases para Estudiantes (US-12)
export function getGetStudentCertificatesUseCase() {
    return new GetStudentCertificatesUseCase(getStudentCertificateRepository());
}

export function getGetCertificateDetailsUseCase() {
    return new GetCertificateDetailsUseCase(getStudentCertificateRepository());
}

export function getDownloadCertificateUseCase() {
    return new DownloadCertificateUseCase(getStudentCertificateRepository());
}
