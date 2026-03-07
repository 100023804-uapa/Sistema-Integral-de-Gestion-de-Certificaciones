import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Signer, CreateSignerRequest, UpdateSignerRequest } from '../../types/signer';
import { ISignerRepository } from '../../domain/repositories/ISignerRepository';

const COLLECTION_NAME = 'signers';

function mapToSigner(id: string, data: any): Signer {
    return {
        id,
        name: data.name,
        title: data.title,
        department: data.department,
        signatureUrl: data.signatureUrl,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    };
}

export class FirebaseSignerRepository implements ISignerRepository {
    async create(data: CreateSignerRequest): Promise<Signer> {
        const docRef = doc(collection(db, COLLECTION_NAME));

        const newSigner = {
            ...data,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, newSigner);

        // Fetch para obtener las fechas parseadas correctamente
        const savedDoc = await getDoc(docRef);
        return mapToSigner(savedDoc.id, savedDoc.data()!);
    }

    async findById(id: string): Promise<Signer | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return mapToSigner(docSnap.id, docSnap.data());
    }

    async findAll(includeInactive: boolean = false): Promise<Signer[]> {
        const q = includeInactive
            ? collection(db, COLLECTION_NAME)
            : query(collection(db, COLLECTION_NAME), where('isActive', '==', true));

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => mapToSigner(doc.id, doc.data()));
    }

    async update(id: string, updates: UpdateSignerRequest): Promise<Signer> {
        const docRef = doc(db, COLLECTION_NAME, id);

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(docRef, updateData);

        // Fetch the updated document
        const updatedDoc = await getDoc(docRef);
        return mapToSigner(updatedDoc.id, updatedDoc.data()!);
    }

    async delete(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        // Realizamos un soft delete (isActive = false)
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: serverTimestamp()
        });
    }
}
