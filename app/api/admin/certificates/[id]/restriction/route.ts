import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import {
  applyCertificateRestriction,
  releaseCertificateRestriction,
} from '@/lib/server/certificateRestrictions';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRestrictionType(value: unknown): value is 'payment' | 'documents' | 'administrative' {
  return (
    value === 'payment' ||
    value === 'documents' ||
    value === 'administrative'
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'release' ? 'release' : 'block';

    if (action === 'block') {
      if (!isRestrictionType(body.type)) {
        return NextResponse.json(
          { success: false, error: 'Tipo de restriccion invalido' },
          { status: 400 }
        );
      }

      const result = await applyCertificateRestriction({
        certificateId: decodeURIComponent(id),
        actorId: auth.user.uid,
        actorRole: auth.user.primaryRole,
        type: body.type,
        reason: typeof body.reason === 'string' ? body.reason : '',
      });

      return NextResponse.json({ success: true, data: result });
    }

    const result = await releaseCertificateRestriction({
      certificateId: decodeURIComponent(id),
      actorId: auth.user.uid,
      actorRole: auth.user.primaryRole,
      reason: typeof body.reason === 'string' ? body.reason : undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating certificate restriction:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar la restriccion del certificado',
      },
      { status: 400 }
    );
  }
}
