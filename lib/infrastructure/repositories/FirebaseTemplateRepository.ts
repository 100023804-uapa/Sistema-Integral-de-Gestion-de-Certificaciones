import { db } from '../../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
    startAfter,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { CertificateTemplate, CreateTemplateDTO, UpdateTemplateDTO } from '../../domain/entities/Template';

const COLLECTION_NAME = 'templates';

export class FirebaseTemplateRepository implements ITemplateRepository {
    private pageSize = 20;

    async save(data: CreateTemplateDTO): Promise<CertificateTemplate> {
        const templateData = {
            ...data,
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), templateData);

        return {
            id: docRef.id,
            ...data,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    async update(id: string, data: UpdateTemplateDTO): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }

    async findById(id: string): Promise<CertificateTemplate | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return this.mapDocToEntity(docSnap);
        } else {
            return null;
        }
    }

    async list(activeOnly: boolean = false): Promise<CertificateTemplate[]> {
        let q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));

        if (activeOnly) {
            q = query(q, where('isActive', '==', true));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocToEntity(doc));
    }

    async listPaginated(activeOnly: boolean = false, cursor?: QueryDocumentSnapshot, pageSize: number = this.pageSize): Promise<{ data: CertificateTemplate[]; hasMore: boolean; lastVisible?: QueryDocumentSnapshot }> {
        let q = cursor
            ? query(
                collection(db, COLLECTION_NAME),
                orderBy('updatedAt', 'desc'),
                startAfter(cursor),
                limit(pageSize)
            )
            : query(
                collection(db, COLLECTION_NAME),
                orderBy('updatedAt', 'desc'),
                limit(pageSize)
            );

        if (activeOnly) {
            q = query(q, where('isActive', '==', true));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => this.mapDocToEntity(doc));
        const hasMore = querySnapshot.docs.length === pageSize;
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        return { data, hasMore, lastVisible };
    }

    async delete(id: string): Promise<void> {
        // Soft delete
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: Timestamp.now()
        });
    }

    private mapDocToEntity(doc: any): CertificateTemplate {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
        } as CertificateTemplate;
    }
}
