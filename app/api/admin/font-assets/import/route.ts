import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { inferFontAssetMetadata, isSupportedFontFormat } from '@/lib/config/template-fonts';
import { FontAssetStyle } from '@/lib/types/fontAsset';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const sourceUrl = String(body.url || '').trim();

    if (!sourceUrl) {
      return NextResponse.json(
        { success: false, error: 'La URL de la fuente es obligatoria.' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'La URL de la fuente no es valida.' },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { success: false, error: 'La URL debe usar http o https.' },
        { status: 400 }
      );
    }

    const guessedFileName =
      String(body.fileName || '').trim() ||
      decodeURIComponent(parsedUrl.pathname.split('/').pop() || 'font.woff2');
    const metadata = inferFontAssetMetadata(guessedFileName);

    if (!isSupportedFontFormat(metadata.format)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'La URL debe apuntar directamente a un archivo de fuente soportado (.woff2, .woff, .ttf u .otf).',
        },
        { status: 400 }
      );
    }

    const uploadResult = await utapi.uploadFilesFromUrl({
      url: parsedUrl.toString(),
      name: guessedFileName,
    });

    if (uploadResult.error || !uploadResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error?.message || 'No se pudo importar la fuente desde la URL.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: String(body.name || '').trim() || uploadResult.data.name || guessedFileName,
        family: String(body.family || '').trim() || metadata.family,
        url: uploadResult.data.ufsUrl || uploadResult.data.url,
        key: uploadResult.data.key,
        format: metadata.format,
        weight: String(body.weight || '').trim() || metadata.weight,
        style:
          (String(body.style || '').trim() as FontAssetStyle) ||
          metadata.style ||
          'normal',
        sourceType: 'external',
      },
    });
  } catch (error) {
    console.error('Error importing font from URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al importar fuente desde URL.',
      },
      { status: 500 }
    );
  }
}
