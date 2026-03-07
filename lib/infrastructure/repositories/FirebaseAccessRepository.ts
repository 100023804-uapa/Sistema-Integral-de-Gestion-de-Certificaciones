import { db } from '@/lib/firebase';
import {
    collection,
    deleteDoc,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

const COLLECTION_NAME = 'access_users';

export interface AccessUser {
    id: string;
    email: string;
    role: 'admin';
    createdAt: Date | null;
    createdBy?: string;
    updatedAt: Date | null;
    disabled?: boolean;
}

export interface AccessRequest {
    id: string;
    email: string;
    name: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date | null;
    updatedAt?: Date | null;
}

const REQUESTS_COLLECTION = 'access_requests';

export class FirebaseAccessRepository {
    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    private toEntity(docSnap: any): AccessUser {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            email: data.email,
            role: 'admin',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            createdBy: data.createdBy,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
            disabled: data.disabled || false,
        };
    }

    async hasAdminAccess(email?: string | null): Promise<boolean> {
        if (!email) return false;

        const normalized = this.normalizeEmail(email);
        const snap = await getDoc(doc(db, COLLECTION_NAME, normalized));
        return snap.exists() && snap.data().role === 'admin' && snap.data().disabled !== true;
    }

    async ensureBootstrapAdmin(user: { uid: string; email?: string | null }): Promise<boolean> {
        if (!user.email) return false;

        const normalized = this.normalizeEmail(user.email);
        const existing = await getDoc(doc(db, COLLECTION_NAME, normalized));
        if (existing.exists()) return true;

        const total = await getCountFromServer(collection(db, COLLECTION_NAME));
        if (total.data().count > 0) return false;

        // HARDENING: Only allow bootstrap if email matches the implementation plan / strict env check
        const allowedBootstrapEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        // If Env var is set, enforce it. If not set, maybe fallback to "first comer" (or block, safer to block? let's enforce if set)
        if (allowedBootstrapEmail && normalized !== this.normalizeEmail(allowedBootstrapEmail)) {
            console.warn(`Bootstrap attempt failed: ${normalized} is not the allowed bootstrap admin.`);
            return false;
        }

        await setDoc(doc(db, COLLECTION_NAME, normalized), {
            email: normalized,
            role: 'admin',
            createdBy: user.uid,
            bootstrapped: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return true;
    }

    async listAdmins(): Promise<AccessUser[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((item) => this.toEntity(item));
    }

    async upsertAdmin(email: string, actorId: string): Promise<void> {
        const normalized = this.normalizeEmail(email);
        await setDoc(doc(db, COLLECTION_NAME, normalized), {
            email: normalized,
            role: 'admin',
            createdBy: actorId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            disabled: false,
        }, { merge: true });
    }

    async removeAdmin(email: string): Promise<void> {
        const normalized = this.normalizeEmail(email);
        await setDoc(doc(db, COLLECTION_NAME, normalized), {
            disabled: true,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    async enableAdmin(email: string): Promise<void> {
        const normalized = this.normalizeEmail(email);
        await setDoc(doc(db, COLLECTION_NAME, normalized), {
            disabled: false,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    // --- ACCESS REQUESTS ---

    async createAccessRequest(data: { email: string; name: string; reason: string }): Promise<void> {
        const normalized = this.normalizeEmail(data.email);
        // Check if already requested
        const existing = await getDoc(doc(db, REQUESTS_COLLECTION, normalized));
        if (existing.exists()) {
            // Update existing request
            await setDoc(doc(db, REQUESTS_COLLECTION, normalized), {
                ...data,
                email: normalized,
                status: 'pending',
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return;
        }

        await setDoc(doc(db, REQUESTS_COLLECTION, normalized), {
            ...data,
            email: normalized,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }

    async listAccessRequests(): Promise<AccessRequest[]> {
        const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                email: data.email,
                name: data.name,
                reason: data.reason,
                status: data.status,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            };
        });
    }

    async approveRequest(requestId: string, actorId: string): Promise<void> {
        // 1. Get Request
        const reqRef = doc(db, REQUESTS_COLLECTION, requestId);
        const reqSnap = await getDoc(reqRef);
        if (!reqSnap.exists()) throw new Error('Request not found');

        const data = reqSnap.data();

        // 2. Create Access User (Admin)
        await this.upsertAdmin(data.email, actorId);

        // 3. Update Request Status
        await setDoc(reqRef, { status: 'approved', updatedAt: serverTimestamp() }, { merge: true });
    }

    async rejectRequest(requestId: string): Promise<void> {
        await setDoc(doc(db, REQUESTS_COLLECTION, requestId), {
            status: 'rejected',
            updatedAt: serverTimestamp()
        }, { merge: true });
    }
}
