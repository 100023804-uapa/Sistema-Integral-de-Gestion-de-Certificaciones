'use server';

import { getSystemSettingsRepository } from '@/lib/container';
import { EmailConfig } from '@/lib/types/systemSettings';

export async function getEmailSettings() {
    try {
        const repo = getSystemSettingsRepository();
        const settings = await repo.getSettings();
        return { success: true, data: settings?.emailConfig || null };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
}

export async function saveEmailSettings(config: EmailConfig) {
    try {
        const repo = getSystemSettingsRepository();
        const settings = await repo.getSettings();
        
        await repo.saveSettings({
            ...settings,
            emailConfig: config,
            updatedBy: 'admin' // Debería obtenerse del auth server-side en un entorno real
        });

        return { success: true };
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: 'Failed to save settings' };
    }
}
