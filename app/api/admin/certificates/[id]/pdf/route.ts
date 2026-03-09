import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getCertificateRepository } from '@/lib/container';

const utapi = new UTApi();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'El archivo PDF es obligatorio.' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un PDF valido.' },
        { status: 400 }
      );
    }

    const certificateRepository = getCertificateRepository();
    const certificate = await certificateRepository.findById(id);

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado.' },
        { status: 404 }
      );
    }

    const uploadResult = await utapi.uploadFiles(file);
    const uploaded = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

    if (uploaded.error || !uploaded.data) {
      return NextResponse.json(
        {
          success: false,
          error: uploaded.error?.message || 'No se pudo subir el PDF del certificado.',
        },
        { status: 500 }
      );
    }

    const pdfUrl = uploaded.data.ufsUrl || uploaded.data.url;
    const pdfStorageKey = uploaded.data.key;
    const previousKey = certificate.metadata?.pdfStorageKey;

    if (previousKey && previousKey !== pdfStorageKey) {
      try {
        await utapi.deleteFiles(previousKey);
      } catch (deleteError) {
        console.error('Error deleting previous certificate PDF:', deleteError);
      }
    }

    await certificateRepository.updatePdfAsset(id, pdfUrl, pdfStorageKey);

    return NextResponse.json({
      success: true,
      data: {
        pdfUrl,
        pdfStorageKey,
      },
    });
  } catch (error) {
    console.error('Error persisting certificate PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al persistir el PDF del certificado.',
      },
      { status: 500 }
    );
  }
}
