import { NextRequest, NextResponse } from 'next/server';

import { requireInternalUserRole } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
    if (auth.response) {
      return auth.response;
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'La emisión oficial ahora debe realizarse desde /dashboard/certificate-states para generar y persistir un PDF real antes de cerrar el estado.',
      },
      { status: 409 }
    );
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al generar certificado' },
      { status: 500 }
    );
  }
}
