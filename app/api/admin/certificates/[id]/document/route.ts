import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedInternalUser } from '@/lib/auth/server';
import { getCertificateRepository } from '@/lib/container';
import { isCertificateBlocked } from '@/lib/types/certificateStatus';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedInternalUser(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const certificate = await getCertificateRepository().findById(
      decodeURIComponent(id)
    );

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    if (isCertificateBlocked(certificate.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'El documento oficial no esta disponible mientras exista una restriccion activa',
        },
        { status: 423 }
      );
    }

    if (!certificate.pdfUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'El certificado aun no tiene un PDF oficial generado',
        },
        { status: 409 }
      );
    }

    const disposition =
      request.nextUrl.searchParams.get('disposition') === 'inline'
        ? 'inline'
        : 'attachment';

    const sourceUrl = new URL(certificate.pdfUrl, request.url);
    const upstream = await fetch(sourceUrl, { cache: 'no-store' });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fue posible recuperar el PDF oficial del certificado',
        },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/pdf'
    );
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="Certificado_${certificate.folio}.pdf"`
    );
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching official certificate document:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible abrir el documento oficial',
      },
      { status: 500 }
    );
  }
}
