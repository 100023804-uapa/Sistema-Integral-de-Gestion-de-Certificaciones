export interface EmailConfig {
    provider: 'gmail' | 'smtp' | 'resend';
    user: string;
    password: string; // App Password o API Key
    fromName: string;
}

export interface SystemSettings {
    id?: string;
    emailConfig?: EmailConfig;
    emailDeliveryEnabled?: boolean;
    updatedAt: Date;
    updatedBy: string;
}
