import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import {
  applyPreferredTemplateToMissingCertificates,
  applyProgramMatchesToCertificates,
  assignPrimarySignerToMissingCertificates,
  authorizeInternalEmailForSigner,
  buildCertificateMetadataSanitationReport,
} from '@/lib/server/certificateMetadataSanitation';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const report = await buildCertificateMetadataSanitationReport();

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error building certificate metadata sanitation report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No fue posible generar la auditoría de metadatos de certificados.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';
    const certificateIds = Array.isArray(body.certificateIds)
      ? body.certificateIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined;
    const changedBy = authResult.session.email || authResult.session.sub;

    let result;

    if (action === 'apply_preferred_template') {
      result = await applyPreferredTemplateToMissingCertificates(changedBy, certificateIds);
    } else if (action === 'apply_program_matches') {
      result = await applyProgramMatchesToCertificates(changedBy, certificateIds);
    } else if (action === 'assign_primary_signer') {
      const signerId = typeof body.signerId === 'string' ? body.signerId.trim() : '';
      if (!signerId) {
        return NextResponse.json(
          { success: false, error: 'Debes seleccionar un firmante activo para el saneamiento.' },
          { status: 400 }
        );
      }

      result = await assignPrimarySignerToMissingCertificates(signerId, changedBy, certificateIds);
    } else if (action === 'authorize_signer_email') {
      const signerId = typeof body.signerId === 'string' ? body.signerId.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';

      if (!signerId || !email) {
        return NextResponse.json(
          { success: false, error: 'Debes seleccionar un firmante y un usuario interno.' },
          { status: 400 }
        );
      }

      result = await authorizeInternalEmailForSigner(signerId, email);
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción de saneamiento no soportada.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error applying certificate metadata sanitation:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible aplicar el saneamiento de metadatos.',
      },
      { status: 500 }
    );
  }
}
