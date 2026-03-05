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
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AcademicArea, CreateAcademicAreaRequest, UpdateAcademicAreaRequest } from '@/lib/types/academicArea';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseAcademicAreaRepository {
  private readonly collectionName = 'academicAreas';

  async create(data: CreateAcademicAreaRequest): Promise<AcademicArea> {
    const now = new Date();
    const academicAreaData = {
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), academicAreaData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create academic area');
    }

    return this.mapToAcademicArea(docSnap);
  }

  async findById(id: string): Promise<AcademicArea | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToAcademicArea(docSnap);
  }

  async findAll(): Promise<AcademicArea[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToAcademicArea);
  }

  async findActive(): Promise<AcademicArea[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToAcademicArea);
  }

  async findByCampus(campusId: string): Promise<AcademicArea[]> {
    const q = query(
      collection(db, this.collectionName),
      where('campusId', '==', campusId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToAcademicArea);
  }

  async update(id: string, data: UpdateAcademicAreaRequest): Promise<AcademicArea> {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update academic area');
    }

    return this.mapToAcademicArea(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private mapToAcademicArea = (doc: QueryDocumentSnapshot<DocumentData>): AcademicArea => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      code: data.code || '',
      description: data.description,
      campusId: data.campusId || '',
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };
}
