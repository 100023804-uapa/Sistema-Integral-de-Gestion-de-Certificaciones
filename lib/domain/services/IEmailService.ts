export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface IEmailService {
    sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
