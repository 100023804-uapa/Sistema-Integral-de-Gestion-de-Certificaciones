import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListSignersUseCase, getCreateSignerUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const listSignersUseCase = getListSignersUseCase();
    const signers = await listSignersUseCase.execute(!activeOnly);

    return NextResponse.json({
      success: true,
      data: signers,
    });
  } catch (error) {
    console.error('Error fetching signers:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener firmantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    if (!body.name || !body.title) {
      return NextResponse.json(
        { success: false, error: 'El nombre y cargo son obligatorios' },
        { status: 400 }
      );
    }

    const createSignerUseCase = getCreateSignerUseCase();
    const signer = await createSignerUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: signer,
    });
  } catch (error) {
    console.error('Error creating signer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al registrar firmante' },
      { status: 500 }
    );
  }
}
