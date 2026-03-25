import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { buildCertificateWorkflowSanitationReport } from '@/lib/server/certificateWorkflowSanitation';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const report = await buildCertificateWorkflowSanitationReport();

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error building certificate workflow sanitation report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No fue posible generar la auditoría del flujo de certificados.',
      },
      { status: 500 }
    );
  }
}
