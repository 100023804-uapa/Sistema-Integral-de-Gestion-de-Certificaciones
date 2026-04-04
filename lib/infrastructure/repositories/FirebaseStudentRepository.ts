import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, limit as firestoreLimit, orderBy, Timestamp, startAfter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { Student, CreateStudentDTO, StudentPortalAccess, StudentPortalAccountStatus } from '../../domain/entities/Student';
import {
    normalizeStudentIdentityDocument,
    normalizeStudentIdentityDocumentKey,
    validateStudentIdentityDocument,
} from '@/lib/validation/studentIdentity';

export class FirebaseStudentRepository implements IStudentRepository {
    private collectionName = 'students';
    private pageSize = 50;

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private async ensureUniqueIdentityDocument(
        studentId: string,
        rawValue: string | undefined,
        operation: 'create' | 'update'
    ) {
        if (!rawValue || rawValue.trim() === '') {
            return {
                normalizedDocument: undefined,
                normalizedDocumentKey: undefined,
            };
        }

        const validation = validateStudentIdentityDocument(rawValue);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const normalizedDocument = validation.normalized || undefined;
        const normalizedDocumentKey = validation.key || undefined;

        if (!normalizedDocument || !normalizedDocumentKey) {
            return {
                normalizedDocument: undefined,
                normalizedDocumentKey: undefined,
            };
        }

        const normalizedQuery = query(
            collection(db, this.collectionName),
            where('identityDocumentNormalized', '==', normalizedDocumentKey),
            firestoreLimit(1)
        );
        const normalizedSnap = await getDocs(normalizedQuery);

        if (!normalizedSnap.empty) {
            const existingDoc = normalizedSnap.docs[0];
            if (operation === 'create' || existingDoc.id !== studentId) {
                throw new Error(
                    `Ya existe otro participante registrado con el documento ${normalizedDocument}`
                );
            }
        }

        const legacyValues = Array.from(
            new Set([
                rawValue.trim(),
                normalizedDocument,
                normalizeStudentIdentityDocumentKey(rawValue),
            ].filter((value): value is string => Boolean(value)))
        );

        for (const legacyValue of legacyValues) {
            const legacyQuery = query(
                collection(db, this.collectionName),
                where('cedula', '==', legacyValue),
                firestoreLimit(1)
            );
            const legacySnap = await getDocs(legacyQuery);
            if (!legacySnap.empty) {
                const existingDoc = legacySnap.docs[0];
                if (operation === 'create' || existingDoc.id !== studentId) {
                    throw new Error(
                        `Ya existe otro participante registrado con el documento ${normalizedDocument}`
                    );
                }
            }
        }

        return {
            normalizedDocument,
            normalizedDocumentKey,
        };
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

    private toOptionalString(value: unknown): string | undefined {
        return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
    }

    private stripUndefinedEntries<T extends Record<string, unknown>>(value: T): Partial<T> {
        return Object.fromEntries(
            Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
        ) as Partial<T>;
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
        // Validación de duplicado por Matrícula (ID)
        const docRef = doc(db, this.collectionName, student.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            throw new Error(`Ya existe un participante registrado con la matrícula ${student.id}`);
        }

        const { normalizedDocument, normalizedDocumentKey } =
            await this.ensureUniqueIdentityDocument(student.id, student.cedula, 'create');

        const now = new Date();
        const normalizedEmail = this.normalizeEmail(student.email);

        const newStudent: Student = {
            ...student,
            cedula: normalizedDocument,
            email: normalizedEmail,
            createdAt: now,
            updatedAt: now,
        };

        await setDoc(docRef, {
            ...this.stripUndefinedEntries(newStudent as unknown as Record<string, unknown>),
            identityDocumentNormalized: normalizedDocumentKey,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        });

        return newStudent;
    }

    async update(id: string, data: Partial<Student>): Promise<void> {
        const { normalizedDocument, normalizedDocumentKey } =
            await this.ensureUniqueIdentityDocument(id, data.cedula, 'update');

        const docRef = doc(db, this.collectionName, id);
        const payload = {
            ...data,
            cedula: data.cedula === undefined ? undefined : normalizedDocument,
            identityDocumentNormalized:
                data.cedula === undefined ? undefined : normalizedDocumentKey || null,
            email: data.email ? this.normalizeEmail(data.email) : data.email,
            updatedAt: Timestamp.now(),
        };

        await setDoc(docRef, {
            ...this.stripUndefinedEntries(payload as unknown as Record<string, unknown>),
        }, { merge: true });
    }

    async list(limitCount: number = 50): Promise<Student[]> {
        const q = query(
            collection(db, this.collectionName),
            orderBy('createdAt', 'desc'),
            firestoreLimit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => this.mapDocToStudent(doc));
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
        const data = querySnapshot.docs.map((doc) => this.mapDocToStudent(doc));
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
            cedula: normalizeStudentIdentityDocument(data.cedula),
            phone: data.phone,
            career: data.career,
            programId: this.toOptionalString(data.programId),
            programNameSnapshot: this.toOptionalString(data.programNameSnapshot) || this.toOptionalString(data.career),
            campusId: this.toOptionalString(data.campusId),
            campusNameSnapshot: this.toOptionalString(data.campusNameSnapshot),
            academicAreaId: this.toOptionalString(data.academicAreaId),
            academicAreaNameSnapshot: this.toOptionalString(data.academicAreaNameSnapshot),
            portalAccess: this.mapPortalAccess(data.portalAccess),
            createdAt: this.toDate(data.createdAt) || new Date(),
            updatedAt: this.toDate(data.updatedAt) || new Date(),
        };
    }
}
