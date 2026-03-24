import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, limit as firestoreLimit, orderBy, Timestamp, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { Student, CreateStudentDTO, StudentPortalAccess, StudentPortalAccountStatus } from '../../domain/entities/Student';

export class FirebaseStudentRepository implements IStudentRepository {
    private collectionName = 'students';
    private pageSize = 50;

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private toDate(value: any): Date | undefined {
        if (!value) return undefined;
        if (value.toDate) return value.toDate();
        if (value instanceof Date) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    private mapPortalAccess(value: any): StudentPortalAccess | undefined {
        if (!value || typeof value !== 'object') {
            return undefined;
        }

        const status = (
            value.status === 'invited' ||
            value.status === 'active' ||
            value.status === 'disabled'
        ) ? value.status : 'inactive';

        return {
            enabled: value.enabled === true,
            authUid: typeof value.authUid === 'string' ? value.authUid : undefined,
            status: status as StudentPortalAccountStatus,
            mustChangePassword: value.mustChangePassword === true,
            temporaryPasswordIssuedAt: this.toDate(value.temporaryPasswordIssuedAt),
            temporaryPasswordIssuedBy: typeof value.temporaryPasswordIssuedBy === 'string' ? value.temporaryPasswordIssuedBy : undefined,
            lastTemporaryResetAt: this.toDate(value.lastTemporaryResetAt),
            lastTemporaryResetBy: typeof value.lastTemporaryResetBy === 'string' ? value.lastTemporaryResetBy : undefined,
            activatedAt: this.toDate(value.activatedAt),
            lastLoginAt: this.toDate(value.lastLoginAt),
            lastPasswordChangeAt: this.toDate(value.lastPasswordChangeAt),
        };
    }

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
        const docRef = doc(db, this.collectionName, student.id);
        const now = new Date();
        const normalizedEmail = this.normalizeEmail(student.email);

        const newStudent: Student = {
            ...student,
            email: normalizedEmail,
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
        const docRef = doc(db, this.collectionName, id);
        const payload = {
            ...data,
            email: data.email ? this.normalizeEmail(data.email) : data.email,
            updatedAt: Timestamp.now(),
        };

        await setDoc(docRef, {
            ...payload,
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
            email: this.normalizeEmail(data.email || ''),
            cedula: data.cedula,
            phone: data.phone,
            career: data.career,
            portalAccess: this.mapPortalAccess(data.portalAccess),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };
    }
}
