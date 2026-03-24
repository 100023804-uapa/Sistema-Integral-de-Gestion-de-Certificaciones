import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { buildStudentCertificateAuditReport } from '@/lib/server/studentCertificateAudit';

export async function GET(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const report = await buildStudentCertificateAuditReport();
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error building student/certificate audit report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No fue posible generar la auditoría de participantes y certificados',
      },
      { status: 500 }
    );
  }
}
