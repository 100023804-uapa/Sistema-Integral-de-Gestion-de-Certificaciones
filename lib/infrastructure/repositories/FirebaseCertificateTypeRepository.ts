import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  limit,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CertificateType, CreateCertificateTypeRequest, UpdateCertificateTypeRequest } from '@/lib/types/certificateType';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseCertificateTypeRepository {
  private readonly collectionName = 'certificateTypes';

  async create(data: CreateCertificateTypeRequest): Promise<CertificateType> {
    const now = new Date();
    const certificateTypeData = {
      ...data,
      requiresSignature: data.requiresSignature ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), certificateTypeData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create certificate type');
    }

    return this.mapToCertificateType(docSnap);
  }

  async findById(id: string): Promise<CertificateType | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToCertificateType(docSnap);
  }

  async findAll(): Promise<CertificateType[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateType);
  }

  async findActive(): Promise<CertificateType[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateType);
  }

  async findByCode(code: string): Promise<CertificateType | null> {
    const q = query(
      collection(db, this.collectionName),
      where('code', '==', code),
      where('isActive', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToCertificateType(querySnapshot.docs[0]);
  }

  async update(id: string, data: UpdateCertificateTypeRequest): Promise<CertificateType> {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update certificate type');
    }

    return this.mapToCertificateType(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private mapToCertificateType = (doc: QueryDocumentSnapshot<DocumentData>): CertificateType => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      code: data.code || 'horizontal',
      description: data.description,
      requiresSignature: data.requiresSignature ?? true,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };
}
