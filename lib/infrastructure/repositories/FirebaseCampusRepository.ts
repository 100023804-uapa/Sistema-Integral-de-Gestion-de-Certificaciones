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
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campus, CreateCampusRequest, UpdateCampusRequest } from '@/lib/types/campus';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseCampusRepository {
  private readonly collectionName = 'campuses';

  async create(data: CreateCampusRequest): Promise<Campus> {
    const now = new Date();
    const campusData = {
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), campusData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create campus');
    }

    return this.mapToCampus(docSnap);
  }

  async findById(id: string): Promise<Campus | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToCampus(docSnap);
  }

  async findAll(): Promise<Campus[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCampus);
  }

  async findActive(): Promise<Campus[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCampus);
  }

  async update(id: string, data: UpdateCampusRequest): Promise<Campus> {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update campus');
    }

    return this.mapToCampus(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private mapToCampus = (doc: QueryDocumentSnapshot<DocumentData>): Campus => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      code: data.code || '',
      address: data.address,
      phone: data.phone,
      email: data.email,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };
}
