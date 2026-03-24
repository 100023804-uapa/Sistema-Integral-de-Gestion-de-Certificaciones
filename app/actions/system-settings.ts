'use server';

import { getEmailProvider } from '@/lib/email/provider';
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

export async function getOperationalEmailStatus() {
    try {
        const provider = getEmailProvider();
        const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || null;

        return {
            success: true,
            data: {
                configured: Boolean(provider),
                source: 'deployment-env' as const,
                provider: provider?.name || configuredProvider,
                from: process.env.EMAIL_FROM || null,
                replyTo: process.env.EMAIL_REPLY_TO || null,
            },
        };
    } catch (error) {
        console.error('Error fetching operational email status:', error);
        return { success: false, error: 'Failed to fetch operational email status' };
    }
}
