import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { sendOperationalEmail } from '@/lib/server/operationalEmail';

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const currentUser = auth.user!;
    const body = (await request.json().catch(() => ({}))) as {
      to?: string;
    };

    const targetEmail =
      typeof body.to === 'string' && body.to.trim()
        ? body.to.trim().toLowerCase()
        : currentUser.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'No hay correo destino disponible para la prueba.' },
        { status: 400 }
      );
    }

    const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || 'auto';
    const result = await sendOperationalEmail({
      to: targetEmail,
      subject: 'SIGCE: correo de prueba operativo',
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #0f172a;">Correo de prueba de SIGCE</h2>
          <p>Este mensaje confirma que el proveedor transaccional del sistema pudo procesar un envio real.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p><strong>Proveedor:</strong> ${configuredProvider}</p>
            <p><strong>Destino:</strong> ${targetEmail}</p>
            <p><strong>Solicitado por:</strong> ${currentUser.email}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-DO')}</p>
            <p><strong>Aplicacion:</strong> ${getBaseUrl()}</p>
          </div>
          <p>Si recibes este mensaje, el circuito base de notificaciones ya esta operativo.</p>
        </div>
      `,
      text: `Prueba de correo SIGCE\nProveedor: ${configuredProvider}\nDestino: ${targetEmail}\nSolicitado por: ${currentUser.email}\nAplicacion: ${getBaseUrl()}`,
    });

    if (!result.success) {
      const statusCode =
        result.suppressionReason === 'delivery-paused'
          ? 409
          : result.suppressionReason === 'provider-missing'
            ? 400
            : result.suppressionReason === 'settings-unavailable'
              ? 503
              : 502;

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'No fue posible enviar el correo de prueba.',
          code: result.suppressionReason || null,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: result.provider,
        messageId: result.messageId || null,
        to: targetEmail,
      },
    });
  } catch (error) {
    console.error('Error sending test operational email:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible ejecutar la prueba de correo.' },
      { status: 500 }
    );
  }
}
