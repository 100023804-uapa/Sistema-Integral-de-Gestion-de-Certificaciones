import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CreateSignatureRequest,
  DigitalSignature,
  RejectSignatureRequest,
  SignatureRequest,
  SignatureStatus,
  SignatureTemplate,
  SignCertificateRequest,
} from '@/lib/types/digitalSignature';
import { FirebaseCertificateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';
import { FirebaseAcademicAreaRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicAreaRepository';

interface InternalUserSummary {
  uid: string;
  email: string;
  displayName: string;
  roleCode: string;
  status: string;
}

export class FirebaseDigitalSignatureRepository {
  private readonly signaturesCollection = 'digitalSignatures';
  private readonly requestsCollection = 'signatureRequests';
  private readonly templatesCollection = 'signatureTemplates';
  private readonly internalUsersCollection = 'internal_users';
  private readonly certificateRepository = new FirebaseCertificateRepository();
  private readonly campusRepository = new FirebaseCampusRepository();
  private readonly academicAreaRepository = new FirebaseAcademicAreaRepository();

  async createSignatureRequest(
    data: CreateSignatureRequest,
    requestedBy: string
  ): Promise<SignatureRequest> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (data.expiresInHours || 72) * 60 * 60 * 1000
    );

    const [certificateData, signer, requester] = await Promise.all([
      this.getCertificateData(data.certificateId),
      this.getInternalUserSummary(data.requestedTo),
      this.getInternalUserSummary(requestedBy),
    ]);

    if (!signer) {
      throw new Error('No se encontró el firmante seleccionado');
    }

    if (signer.status === 'disabled') {
      throw new Error('El firmante seleccionado se encuentra deshabilitado');
    }

    const requestData = {
      certificateId: data.certificateId,
      requestedBy,
      requestedByName: requester?.displayName || '',
      requestedByEmail: requester?.email || '',
      requestedTo: data.requestedTo,
      requestedToName: signer.displayName,
      requestedToEmail: signer.email,
      requestedToRole: signer.roleCode,
      message: data.message || null,
      status: 'pending' as SignatureStatus,
      requestedAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
      certificateData: {
        ...certificateData,
        issueDate: Timestamp.fromDate(certificateData.issueDate),
      },
    };

    const docRef = await addDoc(collection(db, this.requestsCollection), requestData);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Failed to create signature request');
    }

    return this.mapToSignatureRequest(docSnap);
  }

  async getSignatureRequestsBySigner(
    signerId: string,
    status?: SignatureStatus
  ): Promise<SignatureRequest[]> {
    let q = query(
      collection(db, this.requestsCollection),
      where('requestedTo', '==', signerId),
      orderBy('requestedAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, this.requestsCollection),
        where('requestedTo', '==', signerId),
        where('status', '==', status),
        orderBy('requestedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToSignatureRequest);
  }

  async getSignatureRequestsByRequester(
    requestedBy: string
  ): Promise<SignatureRequest[]> {
    const q = query(
      collection(db, this.requestsCollection),
      where('requestedBy', '==', requestedBy),
      orderBy('requestedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToSignatureRequest);
  }

  async getSignatureRequest(certificateId: string): Promise<SignatureRequest | null> {
    const q = query(
      collection(db, this.requestsCollection),
      where('certificateId', '==', certificateId),
      orderBy('requestedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToSignatureRequest(querySnapshot.docs[0]);
  }

  async createSignature(data: SignCertificateRequest): Promise<DigitalSignature> {
    const now = new Date();
    const signer = await this.getInternalUserSummary(data.signerId);

    if (!signer) {
      throw new Error('No se encontró el firmante que intenta registrar la firma');
    }

    const signatureData = {
      certificateId: data.certificateId,
      signerId: data.signerId,
      signerName: signer.displayName,
      signerEmail: signer.email,
      signerRole: signer.roleCode,
      signatureData: {
        signatureBase64: data.signatureData.signatureBase64,
        timestamp: Timestamp.fromDate(now),
        ipAddress: data.signatureData.ipAddress || '',
        userAgent: data.signatureData.userAgent || '',
        location: data.signatureData.location || null,
      },
      status: 'signed' as SignatureStatus,
      requestedAt: Timestamp.fromDate(now),
      signedAt: Timestamp.fromDate(now),
      comments: data.signatureData.comments || null,
      metadata: {},
    };

    const docRef = await addDoc(collection(db, this.signaturesCollection), signatureData);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Failed to create digital signature');
    }

    const signature = this.mapToDigitalSignature(docSnap);
    await this.updateSignatureRequestStatus(data.certificateId, 'signed');

    return signature;
  }

  async rejectSignature(data: RejectSignatureRequest): Promise<void> {
    const q = query(
      collection(db, this.requestsCollection),
      where('certificateId', '==', data.certificateId),
      where('requestedTo', '==', data.signerId),
      orderBy('requestedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return;
    }

    await updateDoc(querySnapshot.docs[0].ref, {
      status: 'rejected',
      respondedAt: Timestamp.fromDate(new Date()),
      rejectionReason: data.rejectionReason,
    });
  }

  async getSignatureByCertificate(
    certificateId: string
  ): Promise<DigitalSignature | null> {
    const q = query(
      collection(db, this.signaturesCollection),
      where('certificateId', '==', certificateId),
      orderBy('signedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToDigitalSignature(querySnapshot.docs[0]);
  }

  async getSignaturesBySigner(signerId: string): Promise<DigitalSignature[]> {
    const q = query(
      collection(db, this.signaturesCollection),
      where('signerId', '==', signerId),
      orderBy('signedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToDigitalSignature);
  }

  async createTemplate(
    template: Omit<SignatureTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SignatureTemplate> {
    const now = new Date();
    const templateData = {
      ...template,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(collection(db, this.templatesCollection), templateData);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Failed to create signature template');
    }

    return this.mapToSignatureTemplate(docSnap);
  }

  async getActiveTemplates(): Promise<SignatureTemplate[]> {
    const q = query(
      collection(db, this.templatesCollection),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToSignatureTemplate);
  }

  async updateTemplate(
    id: string,
    data: Partial<SignatureTemplate>
  ): Promise<SignatureTemplate> {
    const docRef = doc(db, this.templatesCollection, id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update signature template');
    }

    return this.mapToSignatureTemplate(updatedDoc);
  }

  private async updateSignatureRequestStatus(
    certificateId: string,
    status: SignatureStatus
  ): Promise<void> {
    const q = query(
      collection(db, this.requestsCollection),
      where('certificateId', '==', certificateId),
      orderBy('requestedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return;
    }

    await updateDoc(querySnapshot.docs[0].ref, {
      status,
      respondedAt: Timestamp.fromDate(new Date()),
    });
  }

  private async getInternalUserSummary(
    uid: string
  ): Promise<InternalUserSummary | null> {
    const internalUserDoc = await getDoc(doc(db, this.internalUsersCollection, uid));

    if (!internalUserDoc.exists()) {
      return null;
    }

    const data = internalUserDoc.data();
    return {
      uid,
      email: typeof data.email === 'string' ? data.email : '',
      displayName:
        typeof data.displayName === 'string' ? data.displayName : 'Usuario interno',
      roleCode: typeof data.roleCode === 'string' ? data.roleCode : '',
      status: typeof data.status === 'string' ? data.status : 'invited',
    };
  }

  private async getCertificateData(certificateId: string): Promise<{
    folio: string;
    studentName: string;
    academicProgram: string;
    issueDate: Date;
    campusName: string;
    academicAreaName?: string;
  }> {
    const certificate = await this.certificateRepository.findById(certificateId);

    if (!certificate) {
      throw new Error('No se encontró el certificado asociado a la solicitud de firma');
    }

    const [campus, academicArea] = await Promise.all([
      certificate.campusId
        ? this.campusRepository.findById(certificate.campusId)
        : Promise.resolve(null),
      certificate.academicAreaId
        ? this.academicAreaRepository.findById(certificate.academicAreaId)
        : Promise.resolve(null),
    ]);

    return {
      folio: certificate.folio,
      studentName: certificate.studentName,
      academicProgram: certificate.academicProgram,
      issueDate: certificate.issueDate,
      campusName: campus?.name || 'Recinto no especificado',
      academicAreaName: academicArea?.name || undefined,
    };
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return undefined;
  }

  private mapToSignatureRequest = (
    item: { id: string; data: () => DocumentData | undefined }
  ): SignatureRequest => {
    const data = item.data() || {};
    const certificateData =
      data.certificateData && typeof data.certificateData === 'object'
        ? (data.certificateData as Record<string, unknown>)
        : {};

    return {
      id: item.id,
      certificateId: data.certificateId || '',
      requestedBy: data.requestedBy || '',
      requestedByName:
        typeof data.requestedByName === 'string' ? data.requestedByName : undefined,
      requestedByEmail:
        typeof data.requestedByEmail === 'string' ? data.requestedByEmail : undefined,
      requestedTo: data.requestedTo || '',
      requestedToName: data.requestedToName || '',
      requestedToEmail: data.requestedToEmail || '',
      requestedToRole: data.requestedToRole || '',
      message: typeof data.message === 'string' ? data.message : undefined,
      status: (data.status || 'pending') as SignatureStatus,
      requestedAt: this.toDate(data.requestedAt) || new Date(),
      respondedAt: this.toDate(data.respondedAt),
      expiresAt: this.toDate(data.expiresAt) || new Date(),
      rejectionReason:
        typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
      certificateData: {
        folio:
          typeof certificateData.folio === 'string' ? certificateData.folio : '',
        studentName:
          typeof certificateData.studentName === 'string'
            ? certificateData.studentName
            : '',
        academicProgram:
          typeof certificateData.academicProgram === 'string'
            ? certificateData.academicProgram
            : '',
        issueDate: this.toDate(certificateData.issueDate) || new Date(),
        campusName:
          typeof certificateData.campusName === 'string'
            ? certificateData.campusName
            : '',
        academicAreaName:
          typeof certificateData.academicAreaName === 'string'
            ? certificateData.academicAreaName
            : undefined,
      },
    };
  };

  private mapToDigitalSignature = (
    item: { id: string; data: () => DocumentData | undefined }
  ): DigitalSignature => {
    const data = item.data() || {};
    const rawSignatureData =
      data.signatureData && typeof data.signatureData === 'object'
        ? (data.signatureData as Record<string, unknown>)
        : null;

    return {
      id: item.id,
      certificateId: data.certificateId || '',
      signerId: data.signerId || '',
      signerName: data.signerName || '',
      signerEmail: data.signerEmail || '',
      signerRole: data.signerRole || '',
      signatureData: rawSignatureData
        ? {
            signatureBase64:
              typeof rawSignatureData.signatureBase64 === 'string'
                ? rawSignatureData.signatureBase64
                : '',
            timestamp: this.toDate(rawSignatureData.timestamp) || new Date(),
            ipAddress:
              typeof rawSignatureData.ipAddress === 'string'
                ? rawSignatureData.ipAddress
                : '',
            userAgent:
              typeof rawSignatureData.userAgent === 'string'
                ? rawSignatureData.userAgent
                : '',
            location:
              rawSignatureData.location &&
              typeof rawSignatureData.location === 'object'
                ? (rawSignatureData.location as { latitude: number; longitude: number })
                : undefined,
          }
        : undefined,
      status: (data.status || 'pending') as SignatureStatus,
      requestedAt: this.toDate(data.requestedAt) || new Date(),
      signedAt: this.toDate(data.signedAt),
      expiresAt: this.toDate(data.expiresAt),
      comments: typeof data.comments === 'string' ? data.comments : undefined,
      rejectionReason:
        typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
      metadata:
        data.metadata && typeof data.metadata === 'object'
          ? (data.metadata as Record<string, unknown>)
          : undefined,
    };
  };

  private mapToSignatureTemplate = (
    item: { id: string; data: () => DocumentData | undefined }
  ): SignatureTemplate => {
    const data = item.data() || {};
    return {
      id: item.id,
      name: data.name || '',
      description: data.description,
      signaturePosition: data.signaturePosition || { x: 0, y: 0, width: 0, height: 0 },
      requiredFields: data.requiredFields || [],
      isActive: data.isActive ?? true,
      createdAt: this.toDate(data.createdAt) || new Date(),
      updatedAt: this.toDate(data.updatedAt) || new Date(),
    };
  };
}
