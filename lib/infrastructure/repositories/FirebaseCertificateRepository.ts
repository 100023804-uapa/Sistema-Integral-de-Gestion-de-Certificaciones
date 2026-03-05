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
        const qrCodeUrl = `${APP_URL}/verify/${data.folio}`;
        const certificateData = {
            ...data,
            qrCodeUrl,
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

        return {
            id: docSnap.id,
            ...data,
            qrCodeUrl: data.qrCodeUrl || `${APP_URL}/verify/${data.folio}`,
            issueDate: safeToDate(data.issueDate),
            expirationDate: data.expirationDate ? safeToDate(data.expirationDate) : undefined,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
        } as Certificate;
    }
}
