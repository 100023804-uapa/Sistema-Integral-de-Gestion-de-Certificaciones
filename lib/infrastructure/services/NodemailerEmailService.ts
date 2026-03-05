import nodemailer from 'nodemailer';
import { IEmailService, SendEmailOptions } from '@/lib/domain/services/IEmailService';
import { FirebaseSystemSettingsRepository } from '../repositories/FirebaseSystemSettingsRepository';

export class NodemailerEmailService implements IEmailService {
    constructor(private settingsRepository: FirebaseSystemSettingsRepository) {}

    async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // 1. Obtener configuración de la base de datos
            const settings = await this.settingsRepository.getSettings();
            
            let user = settings?.emailConfig?.user;
            let pass = settings?.emailConfig?.password;
            let fromName = settings?.emailConfig?.fromName || 'Sistema SIGCE';

            // 2. Fallback a variables de entorno si no hay configuración en BD
            if (!user || !pass) {
                user = process.env.GMAIL_USER;
                pass = process.env.GMAIL_APP_PASSWORD;
            }

            if (!user || !pass) {
                console.warn('Falta configuración de correo. Abortando envío.');
                return { success: false, error: 'Configuración de correo no encontrada en el sistema.' };
            }

            // 3. Crear el transportador (Acoplado a Gmail por ahora, según requerimiento)
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user,
                    pass,
                },
            });

            // 4. Enviar el correo
            const mailOptions = {
                from: `"${fromName}" <${user}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            };

            const info = await transporter.sendMail(mailOptions);
            
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('Error in NodemailerEmailService:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
