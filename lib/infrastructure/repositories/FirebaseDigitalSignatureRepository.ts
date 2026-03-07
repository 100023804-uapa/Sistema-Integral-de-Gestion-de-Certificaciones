import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  limit,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  DigitalSignature, 
  SignatureRequest, 
  SignatureTemplate,
  CreateSignatureRequest,
  SignCertificateRequest,
  RejectSignatureRequest,
  SignatureStatus 
} from '@/lib/types/digitalSignature';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseDigitalSignatureRepository {
  private readonly signaturesCollection = 'digitalSignatures';
  private readonly requestsCollection = 'signatureRequests';
  private readonly templatesCollection = 'signatureTemplates';

  // Signature Requests
  async createSignatureRequest(data: CreateSignatureRequest, requestedBy: string): Promise<SignatureRequest> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (data.expiresInHours || 72) * 60 * 60 * 1000);

    // Obtener datos del certificado
    const certificateData = await this.getCertificateData(data.certificateId);
    
    const requestData = {
      certificateId: data.certificateId,
      requestedBy,
      requestedTo: data.requestedTo,
      requestedToName: '', // TODO: Obtener del usuario
      requestedToEmail: '', // TODO: Obtener del usuario
      requestedToRole: '', // TODO: Obtener del usuario
      message: data.message,
      status: 'pending' as SignatureStatus,
      requestedAt: now,
      expiresAt,
      certificateData
    };

    const docRef = await addDoc(collection(db, this.requestsCollection), requestData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create signature request');
    }

    return this.mapToSignatureRequest(docSnap);
  }

  async getSignatureRequestsBySigner(signerId: string, status?: SignatureStatus): Promise<SignatureRequest[]> {
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

  async getSignatureRequestsByRequester(requestedBy: string): Promise<SignatureRequest[]> {
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

  // Digital Signatures
  async createSignature(data: SignCertificateRequest): Promise<DigitalSignature> {
    const now = new Date();
    
    const signatureData = {
      certificateId: data.certificateId,
      signerId: data.signerId,
      signerName: '', // TODO: Obtener del usuario
      signerEmail: '', // TODO: Obtener del usuario
      signerRole: '', // TODO: Obtener del usuario
      signatureData: {
        signatureBase64: data.signatureData.signatureBase64,
        timestamp: now,
        ipAddress: '', // TODO: Obtener del request
        userAgent: '', // TODO: Obtener del request
        location: data.signatureData.location
      },
      status: 'signed' as SignatureStatus,
      requestedAt: now,
      signedAt: now,
      comments: data.signatureData.comments,
      metadata: {}
    };

    const docRef = await addDoc(collection(db, this.signaturesCollection), signatureData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create digital signature');
    }

    const signature = this.mapToDigitalSignature(docSnap);
    
    // Actualizar el request
    await this.updateSignatureRequestStatus(data.certificateId, 'signed');
    
    return signature;
  }

  async rejectSignature(data: RejectSignatureRequest): Promise<void> {
    const now = new Date();
    
    // Actualizar el request
    const requestRef = query(
      collection(db, this.requestsCollection),
      where('certificateId', '==', data.certificateId),
      where('requestedTo', '==', data.signerId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(requestRef);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: 'rejected',
        respondedAt: now,
        rejectionReason: data.rejectionReason
      });
    }
  }

  async getSignatureByCertificate(certificateId: string): Promise<DigitalSignature | null> {
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

  // Signature Templates
  async createTemplate(template: Omit<SignatureTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<SignatureTemplate> {
    const now = new Date();
    const templateData = {
      ...template,
      createdAt: now,
      updatedAt: now
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

  async updateTemplate(id: string, data: Partial<SignatureTemplate>): Promise<SignatureTemplate> {
    const docRef = doc(db, this.templatesCollection, id);
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update signature template');
    }

    return this.mapToSignatureTemplate(updatedDoc);
  }

  // Métodos auxiliares
  private async updateSignatureRequestStatus(certificateId: string, status: SignatureStatus): Promise<void> {
    const q = query(
      collection(db, this.requestsCollection),
      where('certificateId', '==', certificateId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        status,
        respondedAt: new Date()
      });
    }
  }

  private async getCertificateData(certificateId: string): Promise<any> {
    // TODO: Implementar obtención de datos del certificado
    return {
      folio: 'CERT-001',
      studentName: 'Juan Pérez',
      academicProgram: 'Programa de Ejemplo',
      issueDate: new Date(),
      campusName: 'Campus Principal',
      academicAreaName: 'Área de Ejemplo'
    };
  }

  // Mappers
  private mapToSignatureRequest = (doc: QueryDocumentSnapshot<DocumentData>): SignatureRequest => {
    const data = doc.data();
    return {
      id: doc.id,
      certificateId: data.certificateId || '',
      requestedBy: data.requestedBy || '',
      requestedTo: data.requestedTo || '',
      requestedToName: data.requestedToName || '',
      requestedToEmail: data.requestedToEmail || '',
      requestedToRole: data.requestedToRole || '',
      message: data.message,
      status: data.status || 'pending',
      requestedAt: data.requestedAt?.toDate() || new Date(),
      respondedAt: data.respondedAt?.toDate(),
      rejectionReason: data.rejectionReason,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      certificateData: data.certificateData || {}
    };
  };

  private mapToDigitalSignature = (doc: QueryDocumentSnapshot<DocumentData>): DigitalSignature => {
    const data = doc.data();
    return {
      id: doc.id,
      certificateId: data.certificateId || '',
      signerId: data.signerId || '',
      signerName: data.signerName || '',
      signerEmail: data.signerEmail || '',
      signerRole: data.signerRole || '',
      signatureData: data.signatureData,
      status: data.status || 'pending',
      requestedAt: data.requestedAt?.toDate() || new Date(),
      signedAt: data.signedAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      comments: data.comments,
      rejectionReason: data.rejectionReason,
      metadata: data.metadata
    };
  };

  private mapToSignatureTemplate = (doc: QueryDocumentSnapshot<DocumentData>): SignatureTemplate => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      description: data.description,
      signaturePosition: data.signaturePosition || { x: 0, y: 0, width: 0, height: 0 },
      requiredFields: data.requiredFields || [],
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  };
}
