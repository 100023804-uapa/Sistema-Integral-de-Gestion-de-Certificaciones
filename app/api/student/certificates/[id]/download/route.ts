import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieValue } from '@/lib/auth/session';
import {
  getStudentCertificateDetail,
  resolveSessionAccessFromSessionCookie,
} from '@/lib/server/studentPortal';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const sessionCookie = getSessionCookieValue(request);
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const access = await resolveSessionAccessFromSessionCookie(sessionCookie);
    if (!access.studentAccess || !access.student) {
      return NextResponse.json(
        { success: false, error: 'Este acceso es solo para participantes' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const certificate = await getStudentCertificateDetail(
      access.student.studentId,
      decodeURIComponent(id)
    );

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    if (!certificate.canDownload) {
      return NextResponse.json(
        {
          success: false,
          error:
            certificate.availabilityMessage ||
            'El certificado no esta disponible para descarga',
        },
        { status: 423 }
      );
    }

    if (!certificate.pdfUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'El certificado aun no tiene un documento descargable asociado',
        },
        { status: 409 }
      );
    }

    return NextResponse.redirect(new URL(certificate.pdfUrl, request.url));
  } catch (error) {
    console.error('Error downloading student certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible procesar la descarga del certificado',
      },
      { status: 400 }
    );
  }
}
