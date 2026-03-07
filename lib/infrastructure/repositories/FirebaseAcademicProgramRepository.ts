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
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AcademicProgram, CreateAcademicProgramRequest, UpdateAcademicProgramRequest } from '@/lib/types/academicProgram';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseAcademicProgramRepository {
    private readonly collectionName = 'academicPrograms';

    async create(data: CreateAcademicProgramRequest): Promise<AcademicProgram> {
        const now = new Date();
        const programData = {
            ...data,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await addDoc(collection(db, this.collectionName), programData);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Failed to create academic program');
        }

        return this.mapToAcademicProgram(docSnap);
    }

    async findById(id: string): Promise<AcademicProgram | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return this.mapToAcademicProgram(docSnap);
    }

    async findAll(): Promise<AcademicProgram[]> {
        const q = query(
            collection(db, this.collectionName),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(this.mapToAcademicProgram);
    }

    async findActive(): Promise<AcademicProgram[]> {
        const q = query(
            collection(db, this.collectionName),
            where('isActive', '==', true),
            orderBy('name', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(this.mapToAcademicProgram);
    }

    async update(id: string, data: UpdateAcademicProgramRequest): Promise<AcademicProgram> {
        const docRef = doc(db, this.collectionName, id);
        const updateData = {
            ...data,
            updatedAt: new Date(),
        };

        await updateDoc(docRef, updateData);

        const updatedDoc = await getDoc(docRef);
        if (!updatedDoc.exists()) {
            throw new Error('Failed to update academic program');
        }

        return this.mapToAcademicProgram(updatedDoc);
    }

    async delete(id: string): Promise<void> {
        // Soft delete
        await this.update(id, { isActive: false });
    }

    private mapToAcademicProgram = (doc: QueryDocumentSnapshot<DocumentData>): AcademicProgram => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || '',
            code: data.code || '',
            description: data.description,
            durationHours: data.durationHours,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };
    };
}
