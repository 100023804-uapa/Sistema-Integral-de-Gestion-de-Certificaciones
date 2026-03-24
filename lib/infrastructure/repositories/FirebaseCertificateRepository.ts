import { db } from '@/lib/firebase';
import {
    addDoc,
    collection,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    runTransaction,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    startAfter,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Certificate, CertificateType, CreateCertificateDTO } from '../../domain/entities/Certificate';
import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';
import type { CertificateRestriction } from '@/lib/types/certificateRestriction';

const COLLECTION_NAME = 'certificates';
const COUNTERS_COLLECTION = 'folio_counters';
const PROGRAM_STATS_COLLECTION = 'program_stats';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://sigce.app';

export interface ProgramStat {
    id: string;
    name: string;
    certificateCount: number;
    lastIssued: Date | null;
    type: CertificateType | null;
}

export class FirebaseCertificateRepository implements ICertificateRepository {
    private pageSize = 20;

    async create(data: CreateCertificateDTO): Promise<Certificate> {
        return this.save(data);
    }

    async save(data: CreateCertificateDTO): Promise<Certificate> {
        const verificationCode = (data as any).publicVerificationCode || data.folio;
        const qrCodeUrl = `${APP_URL}/verify/${verificationCode}`;
        const certificateData = {
            ...data,
            qrCodeUrl,
            publicVerificationCode: verificationCode,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            issueDate: Timestamp.fromDate(new Date(data.issueDate)),
            expirationDate: data.expirationDate ? Timestamp.fromDate(new Date(data.expirationDate)) : null,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), certificateData);

        await this.upsertProgramStats(data);

        return {
            id: docRef.id,
            ...data,
            publicVerificationCode: verificationCode,
            qrCodeUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Certificate;
    }

    async findById(id: string): Promise<Certificate | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return this.mapDocToEntity(docSnap);
        }

        return null;
    }

    async findByFolio(folio: string): Promise<Certificate | null> {
        const q = query(collection(db, COLLECTION_NAME), where('folio', '==', folio), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        return this.mapDocToEntity(querySnapshot.docs[0]);
    }

    async findByVerificationCode(code: string): Promise<Certificate | null> {
        const q = query(collection(db, COLLECTION_NAME), where('publicVerificationCode', '==', code), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        return this.mapDocToEntity(querySnapshot.docs[0]);
    }

    async findByStudentId(studentId: string): Promise<Certificate[]> {
        const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', studentId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((item) => this.mapDocToEntity(item));
    }

    async countByYearAndType(year: number, type: CertificateType): Promise<number> {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const q = query(
            collection(db, COLLECTION_NAME),
            where('type', '==', type),
            where('issueDate', '>=', Timestamp.fromDate(startOfYear)),
            where('issueDate', '<=', Timestamp.fromDate(endOfYear))
        );

        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    }

    async reserveNextSequence(year: number, type: CertificateType, prefix: string = 'sigce'): Promise<number> {
        const normalizedPrefix = prefix.toLowerCase().trim();
        const counterId = `${normalizedPrefix}_${year}_${type}`;
        const counterRef = doc(db, COUNTERS_COLLECTION, counterId);

        return runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(counterRef);
            const current = snapshot.exists() ? Number(snapshot.data().current || 0) : 0;
            const next = current + 1;

            transaction.set(counterRef, {
                prefix: normalizedPrefix,
                year,
                type,
                current: next,
                updatedAt: Timestamp.now(),
                createdAt: snapshot.exists() ? snapshot.data().createdAt || Timestamp.now() : Timestamp.now(),
            }, { merge: true });

            return next;
        });
    }

    async list(limitCount: number = 20): Promise<Certificate[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((item) => this.mapDocToEntity(item));
    }

    async listPaginated(cursor?: QueryDocumentSnapshot, pageSize: number = this.pageSize): Promise<{ data: Certificate[]; hasMore: boolean; lastVisible?: QueryDocumentSnapshot }> {
        const q = cursor
            ? query(
                collection(db, COLLECTION_NAME),
                orderBy('createdAt', 'desc'),
                startAfter(cursor),
                limit(pageSize)
            )
            : query(
                collection(db, COLLECTION_NAME),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((item) => this.mapDocToEntity(item));
        const hasMore = querySnapshot.docs.length === pageSize;
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        return { data, hasMore, lastVisible };
    }

    async findAll(): Promise<Certificate[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((item) => this.mapDocToEntity(item));
    }

    async getProgramStats(limitCount: number = 100): Promise<ProgramStat[]> {
        const q = query(
            collection(db, PROGRAM_STATS_COLLECTION),
            orderBy('certificateCount', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((item) => {
            const data = item.data();
            return {
                id: item.id,
                name: data.name || item.id,
                certificateCount: Number(data.certificateCount || 0),
                lastIssued: data.lastIssued?.toDate ? data.lastIssued.toDate() : null,
                type: (data.type as CertificateType) || null,
            };
        });
    }

    async updateStatus(id: string, status: Certificate['status']): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status,
            updatedAt: Timestamp.now(),
        });
    }

    async updateWorkflowState(
        id: string,
        data: {
            status: Certificate['status'];
            changedBy: string;
            changedAt?: Date;
            comments?: string;
            previousStatus?: Certificate['status'];
        }
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const changedAt = data.changedAt ? Timestamp.fromDate(data.changedAt) : Timestamp.now();
        const updateData: Record<string, unknown> = {
            status: data.status,
            updatedAt: Timestamp.now(),
            stateChangedAt: changedAt,
            stateChangedBy: data.changedBy,
            lastStateComment: data.comments || null,
        };

        if (data.previousStatus) {
            updateData.previousStatus = data.previousStatus;
        }

        if (data.status === 'verified') {
            updateData.verifiedAt = changedAt;
            updateData.verifiedBy = data.changedBy;
        }

        if (data.status === 'signed') {
            updateData.signedAt = changedAt;
            updateData.signedBy = data.changedBy;
        }

        if (data.status === 'issued' || data.status === 'available' || data.status === 'active') {
            updateData.issuedAt = changedAt;
            updateData.issuedBy = data.changedBy;
        }

        await updateDoc(docRef, updateData);
    }

    async updateGeneratedAssets(
        id: string,
        data: {
            pdfUrl?: string;
            qrCodeUrl?: string;
            templateId?: string;
        }
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: Record<string, unknown> = {
            updatedAt: Timestamp.now(),
        };

        if (typeof data.pdfUrl === 'string' && data.pdfUrl.trim()) {
            updateData.pdfUrl = data.pdfUrl.trim();
        }

        if (typeof data.qrCodeUrl === 'string' && data.qrCodeUrl.trim()) {
            updateData.qrCodeUrl = data.qrCodeUrl.trim();
        }

        if (typeof data.templateId === 'string' && data.templateId.trim()) {
            updateData.templateId = data.templateId.trim();
        }

        await updateDoc(docRef, updateData);
    }

    private async upsertProgramStats(data: CreateCertificateDTO): Promise<void> {
        const programKey = this.toProgramKey(data.academicProgram);
        const statRef = doc(db, PROGRAM_STATS_COLLECTION, programKey);

        await setDoc(statRef, {
            name: data.academicProgram,
            type: data.type,
            certificateCount: increment(1),
            lastIssued: Timestamp.fromDate(new Date(data.issueDate)),
            updatedAt: Timestamp.now(),
        }, { merge: true });
    }

    private toProgramKey(programName: string): string {
        const normalized = (programName || 'sin_programa').trim().toLowerCase();
        return normalized
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 96) || 'sin_programa';
    }

    private mapDocToEntity(docSnap: any): Certificate {
        const data = docSnap.data();
        
        // Función segura para convertir fechas
        const safeToDate = (timestamp: any): Date => {
            if (!timestamp) return new Date();
            if (timestamp.toDate) return timestamp.toDate();
            if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
            return new Date();
        };

        const mapRestriction = (value: any): CertificateRestriction | undefined => {
            if (!value || typeof value !== 'object') {
                return undefined;
            }

            const type =
                value.type === 'payment' ||
                value.type === 'documents' ||
                value.type === 'administrative'
                    ? value.type
                    : null;

            const previousStatus =
                typeof value.previousStatus === 'string' ? value.previousStatus : null;

            const blockedBy =
                typeof value.blockedBy === 'string' ? value.blockedBy : null;

            const reason =
                typeof value.reason === 'string' ? value.reason : null;

            if (!type || !previousStatus || !blockedBy || !reason) {
                return undefined;
            }

            return {
                active: value.active !== false,
                type,
                reason,
                blockedAt: safeToDate(value.blockedAt),
                blockedBy,
                previousStatus,
                releasedAt: value.releasedAt ? safeToDate(value.releasedAt) : undefined,
                releasedBy: typeof value.releasedBy === 'string' ? value.releasedBy : undefined,
                releaseReason: typeof value.releaseReason === 'string' ? value.releaseReason : undefined,
            };
        };

        return {
            id: docSnap.id,
            ...data,
            qrCodeUrl: data.qrCodeUrl || `${APP_URL}/verify/${data.folio}`,
            issueDate: safeToDate(data.issueDate),
            expirationDate: data.expirationDate ? safeToDate(data.expirationDate) : undefined,
            previousStatus: data.previousStatus,
            stateChangedAt: data.stateChangedAt ? safeToDate(data.stateChangedAt) : undefined,
            stateChangedBy: typeof data.stateChangedBy === 'string' ? data.stateChangedBy : undefined,
            lastStateComment: typeof data.lastStateComment === 'string' ? data.lastStateComment : undefined,
            verifiedAt: data.verifiedAt ? safeToDate(data.verifiedAt) : undefined,
            verifiedBy: typeof data.verifiedBy === 'string' ? data.verifiedBy : undefined,
            signedAt: data.signedAt ? safeToDate(data.signedAt) : undefined,
            signedBy: typeof data.signedBy === 'string' ? data.signedBy : undefined,
            issuedAt: data.issuedAt ? safeToDate(data.issuedAt) : undefined,
            issuedBy: typeof data.issuedBy === 'string' ? data.issuedBy : undefined,
            restriction: mapRestriction(data.restriction),
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
        } as Certificate;
    }
}
