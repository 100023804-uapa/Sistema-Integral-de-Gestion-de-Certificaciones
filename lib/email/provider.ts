import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

interface EmailProvider {
  readonly name: string;
  isConfigured(): boolean;
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly resend = this.apiKey ? new Resend(this.apiKey) : null;

  isConfigured(): boolean {
    return Boolean(this.apiKey && process.env.EMAIL_FROM);
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.resend || !this.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        error: 'Resend no está configurado correctamente',
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: message.from || process.env.EMAIL_FROM!,
        to: normalizeRecipients(message.to),
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo || process.env.EMAIL_REPLY_TO || undefined,
      });

      if (response.error) {
        return {
          success: false,
          provider: this.name,
          error: response.error.message,
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: response.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Error enviando correo con Resend',
      };
    }
  }
}

class GmailEmailProvider implements EmailProvider {
  readonly name = 'gmail';
  private readonly user = process.env.GMAIL_USER;
  private readonly pass = process.env.GMAIL_APP_PASSWORD;

  isConfigured(): boolean {
    return Boolean(this.user && this.pass);
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.user || !this.pass) {
      return {
        success: false,
        provider: this.name,
        error: 'Gmail no está configurado correctamente',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });

      const info = await transporter.sendMail({
        from: message.from || process.env.EMAIL_FROM || `"SIGCE" <${this.user}>`,
        to: normalizeRecipients(message.to).join(', '),
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo || process.env.EMAIL_REPLY_TO || undefined,
      });

      return {
        success: true,
        provider: this.name,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Error enviando correo con Gmail',
      };
    }
  }
}

export function getEmailProvider(): EmailProvider | null {
  const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (configuredProvider === 'gmail') {
    const gmailProvider = new GmailEmailProvider();
    return gmailProvider.isConfigured() ? gmailProvider : null;
  }

  if (configuredProvider === 'resend') {
    const resendProvider = new ResendEmailProvider();
    return resendProvider.isConfigured() ? resendProvider : null;
  }

  const resendProvider = new ResendEmailProvider();
  if (resendProvider.isConfigured()) {
    return resendProvider;
  }

  const gmailProvider = new GmailEmailProvider();
  if (gmailProvider.isConfigured()) {
    return gmailProvider;
  }

  return null;
}
