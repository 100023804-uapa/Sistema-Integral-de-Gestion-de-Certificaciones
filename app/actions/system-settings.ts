'use server';

import { getOperationalEmailStatusSnapshot } from '@/lib/server/operationalEmail';
import { getServerSystemSettingsRepository } from '@/lib/server-container';
import { EmailConfig } from '@/lib/types/systemSettings';

export async function getEmailSettings() {
    try {
        const repo = getServerSystemSettingsRepository();
        const settings = await repo.getSettings();
        return { success: true, data: settings?.emailConfig || null };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
}

export async function saveEmailSettings(config: EmailConfig) {
    try {
        const repo = getServerSystemSettingsRepository();
        const settings = await repo.getSettings();
        
        await repo.saveSettings({
            emailConfig: config,
            emailDeliveryEnabled: settings?.emailDeliveryEnabled !== false,
            updatedBy: 'admin' // Debería obtenerse del auth server-side en un entorno real
        });

        return { success: true };
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: 'Failed to save settings' };
    }
}

export async function getOperationalEmailStatus() {
    try {
        const status = await getOperationalEmailStatusSnapshot();

        return {
            success: true,
            data: status,
        };
    } catch (error) {
        console.error('Error fetching operational email status:', error);
        return { success: false, error: 'Failed to fetch operational email status' };
    }
}

export async function saveOperationalEmailDeliveryEnabled(emailDeliveryEnabled: boolean) {
    try {
        const repo = getServerSystemSettingsRepository();
        const settings = await repo.getSettings();

        await repo.saveSettings({
            emailConfig: settings?.emailConfig,
            emailDeliveryEnabled,
            updatedBy: 'admin',
        });

        const status = await getOperationalEmailStatusSnapshot();

        return {
            success: true,
            data: status,
        };
    } catch (error) {
        console.error('Error saving operational email policy:', error);
        return { success: false, error: 'Failed to save operational email policy' };
    }
}
