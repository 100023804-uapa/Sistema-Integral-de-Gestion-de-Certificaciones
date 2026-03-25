import { getAdminDb } from '@/lib/firebaseAdmin';
import { SystemSettings } from '@/lib/types/systemSettings';

export class FirebaseSystemSettingsRepository {
    private readonly docId = 'global_settings';
    private readonly collectionName = 'system_config';

    async getSettings(): Promise<SystemSettings | null> {
        const docSnap = await getAdminDb()
            .collection(this.collectionName)
            .doc(this.docId)
            .get();

        if (!docSnap.exists) {
            return null;
        }

        const data = docSnap.data() || {};
        const updatedAt =
            data.updatedAt instanceof Date
                ? data.updatedAt
                : data.updatedAt && typeof data.updatedAt.toDate === 'function'
                    ? data.updatedAt.toDate()
                    : new Date();

        return {
            id: docSnap.id,
            emailConfig: data.emailConfig,
            emailDeliveryEnabled: data.emailDeliveryEnabled !== false,
            updatedAt,
            updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : '',
        };
    }

    async saveSettings(settings: Omit<SystemSettings, 'id' | 'updatedAt'>): Promise<void> {
        const payload: Record<string, unknown> = {
            updatedAt: new Date(),
            updatedBy: settings.updatedBy,
        };

        if (Object.prototype.hasOwnProperty.call(settings, 'emailConfig')) {
            payload.emailConfig = settings.emailConfig ?? null;
        }

        if (typeof settings.emailDeliveryEnabled === 'boolean') {
            payload.emailDeliveryEnabled = settings.emailDeliveryEnabled;
        }

        await getAdminDb()
            .collection(this.collectionName)
            .doc(this.docId)
            .set(payload, { merge: true });
    }
}
