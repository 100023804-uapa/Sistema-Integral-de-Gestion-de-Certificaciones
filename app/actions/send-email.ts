'use server';

import { getEmailProvider } from '@/lib/email/provider';

interface SendCertificateEmailParams {
  to: string;
  studentName: string;
  certificateUrl: string;
  folio: string;
}

export async function sendCertificateEmail({ to, studentName, certificateUrl, folio }: SendCertificateEmailParams) {
  try {
    const provider = getEmailProvider();
    if (!provider) {
      throw new Error('No hay proveedor de correo configurado');
    }

    const result = await provider.sendEmail({
      to,
      subject: `Tu Certificado UAPA está listo - Folio: ${folio}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #003366;">Hola, ${studentName}</h1>
          <p>Tu certificado del programa de educación continua ha sido generado exitosamente.</p>
          <p>Puedes ver, descargar y validar tu certificado haciendo clic en el siguiente enlace:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateUrl}" style="background-color: #e67600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Ver Mi Certificado
            </a>
          </div>

          <p>O copia y pega esta dirección en tu navegador:</p>
          <p><a href="${certificateUrl}" style="color: #003366;">${certificateUrl}</a></p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.<br/>
            Universidad Abierta para Adultos (UAPA)
          </p>
        </div>
      `,
    });

    if (!result.success) {
      throw new Error(result.error || 'No fue posible enviar el correo');
    }

    return { success: true, messageId: result.messageId, provider: result.provider };

  } catch (error) {
    console.error('SERVER ACTION ERROR (Email Provider):', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface SendAdminRequestParams {
  email: string;
  name: string;
  reason: string;
}

export async function sendAdminRequestEmail({ email, name, reason }: SendAdminRequestParams) {
  try {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const provider = getEmailProvider();

    if (!provider || !adminEmail) {
      console.warn('Missing email configuration. Request saved but email not sent.');
      return { success: false, error: 'Email configuration missing' };
    }

    const result = await provider.sendEmail({
      to: adminEmail,
      subject: `Solicitud de Acceso Admin - SIGCE`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #003366;">Nueva Solicitud de Acceso</h2>
          <p>Un usuario ha solicitado acceso administrativo al sistema.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email Solicitante:</strong> ${email}</p>
            <p><strong>Motivo/Departamento:</strong></p>
            <p style="white-space: pre-wrap;">${reason}</p>
          </div>

          <p>Para otorgar acceso, por favor ve al Dashboard > Usuarios y agrega este correo manualmente.</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">
            Sistema Integral de Gestión de Certificaciones (SIGCE)
          </p>
        </div>
      `,
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Email configuration missing' };
    }

    return { success: true, messageId: result.messageId, provider: result.provider };

  } catch (error) {
    console.error('SERVER ACTION ERROR (Admin Request):', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
