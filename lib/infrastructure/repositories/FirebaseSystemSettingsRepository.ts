import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SystemSettings } from '@/lib/types/systemSettings';

export class FirebaseSystemSettingsRepository {
    private readonly docId = 'global_settings';
    private readonly collectionName = 'system_config';

    async getSettings(): Promise<SystemSettings | null> {
        const docRef = doc(db, this.collectionName, this.docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            id: docSnap.id,
            emailConfig: data.emailConfig,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            updatedBy: data.updatedBy || '',
        };
    }

    async saveSettings(settings: Omit<SystemSettings, 'id' | 'updatedAt'>): Promise<void> {
        const docRef = doc(db, this.collectionName, this.docId);
        await setDoc(docRef, {
            ...settings,
            updatedAt: Timestamp.now(),
        }, { merge: true });
    }
}
