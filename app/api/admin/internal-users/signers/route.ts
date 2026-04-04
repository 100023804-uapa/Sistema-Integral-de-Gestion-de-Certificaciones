import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { listEligibleSigningUsersForCertificate, listEligibleSigningUsersForSignerIds } from '@/lib/server/signerAuthorization';

export async function GET(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator', 'coordinator']);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const signerIdsParam = searchParams.get('signerIds');

    const authorization = certificateId
      ? await listEligibleSigningUsersForCertificate(certificateId)
      : await listEligibleSigningUsersForSignerIds(
          (signerIdsParam || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        );

    return NextResponse.json({
      success: true,
      data: authorization.users,
      meta: {
        mode: authorization.mode,
        explanation: authorization.explanation,
        signerIds: authorization.signers.map((signer) => signer.id),
        signerNames: authorization.signers.map((signer) => signer.name),
      },
    });
  } catch (error) {
    console.error('Error listing signer candidates:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible listar los firmantes disponibles' },
      { status: 500 }
    );
  }
}
