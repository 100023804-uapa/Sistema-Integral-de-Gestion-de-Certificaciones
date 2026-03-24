import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

import { requireAdminSession } from '@/lib/auth/admin-session';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const key = String(body.key || '').trim();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'La clave del archivo es obligatoria.' },
        { status: 400 }
      );
    }

    const result = await utapi.deleteFiles(key);

    return NextResponse.json({
      success: result.success,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting font asset file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar el archivo de fuente.',
      },
      { status: 500 }
    );
  }
}
