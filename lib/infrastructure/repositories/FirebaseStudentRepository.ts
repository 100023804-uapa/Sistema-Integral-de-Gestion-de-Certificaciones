import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, limit as firestoreLimit, orderBy, Timestamp, startAfter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { Student, CreateStudentDTO } from '../../domain/entities/Student';

export class FirebaseStudentRepository implements IStudentRepository {
    private collectionName = 'students';
    private pageSize = 50;

    async findById(id: string): Promise<Student | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return this.mapDocToStudent(docSnap);
        } else {
            return null;
        }
    }

    async create(student: CreateStudentDTO): Promise<Student> {
        // Validación de duplicado por Matrícula (ID)
        const docRef = doc(db, this.collectionName, student.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            throw new Error(`Ya existe un participante registrado con la matrícula ${student.id}`);
        }

        // Validación de duplicado por Cédula (si aplica)
        if (student.cedula && student.cedula.trim() !== '') {
            const cedulaQuery = query(
                collection(db, this.collectionName),
                where('cedula', '==', student.cedula.trim())
            );
            const cedulaSnap = await getDocs(cedulaQuery);
            if (!cedulaSnap.empty) {
                throw new Error(`Ya existe un participante registrado con la cédula ${student.cedula}`);
            }
        }

        const now = new Date();

        const newStudent: Student = {
            ...student,
            createdAt: now,
            updatedAt: now,
        };

        await setDoc(docRef, {
            ...newStudent,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        });

        return newStudent;
    }

    async update(id: string, data: Partial<Student>): Promise<void> {
        // Validación de duplicado por Cédula (si aplica y si cambió)
        if (data.cedula && data.cedula.trim() !== '') {
            const cedulaQuery = query(
                collection(db, this.collectionName),
                where('cedula', '==', data.cedula.trim())
            );
            const cedulaSnap = await getDocs(cedulaQuery);
            if (!cedulaSnap.empty) {
                // Verificar que el documento con esta cédula no sea el mismo que se está editando
                const existingDoc = cedulaSnap.docs[0];
                if (existingDoc.id !== id) {
                    throw new Error(`Ya existe otro participante registrado con la cédula ${data.cedula}`);
                }
            }
        }

        const docRef = doc(db, this.collectionName, id);
        await setDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        }, { merge: true });
    }

    async list(limitCount: number = 50): Promise<Student[]> {
        const q = query(
            collection(db, this.collectionName),
            orderBy('createdAt', 'desc'),
            firestoreLimit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(this.mapDocToStudent);
    }

    async listPaginated(cursor?: QueryDocumentSnapshot, pageSize: number = this.pageSize): Promise<{ data: Student[]; hasMore: boolean; lastVisible?: QueryDocumentSnapshot }> {
        const q = cursor
            ? query(
                collection(db, this.collectionName),
                orderBy('createdAt', 'desc'),
                startAfter(cursor),
                firestoreLimit(pageSize)
            )
            : query(
                collection(db, this.collectionName),
                orderBy('createdAt', 'desc'),
                firestoreLimit(pageSize)
            );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(this.mapDocToStudent);
        const hasMore = querySnapshot.docs.length === pageSize;
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        return { data, hasMore, lastVisible };
    }

    private mapDocToStudent(doc: any): Student {
        const data = doc.data();
        return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            cedula: data.cedula,
            phone: data.phone,
            career: data.career,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };
    }
}
