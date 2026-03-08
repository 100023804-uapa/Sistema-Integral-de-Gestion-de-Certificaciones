import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/auth/admin-session';
import { getListTemplatesUseCase, getCreateTemplateUseCase } from '@/lib/container';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const type = searchParams.get('type') as 'horizontal' | 'vertical' | 'institutional_macro' | null;
    const certificateTypeId = searchParams.get('certificateTypeId');

    const listTemplatesUseCase = getListTemplatesUseCase();

    if (type) {
      const templates = await listTemplatesUseCase.findByType(type);
      return NextResponse.json({
        success: true,
        data: templates,
      });
    }

    if (certificateTypeId) {
      const templates = await listTemplatesUseCase.findByCertificateType(certificateTypeId);
      return NextResponse.json({
        success: true,
        data: templates,
      });
    }

    const templates = await listTemplatesUseCase.execute(activeOnly);
    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantillas de certificado' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminSession(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();

    const createTemplateUseCase = getCreateTemplateUseCase();
    const template = await createTemplateUseCase.execute(
      {
        name: body.name,
        description: body.description,
        type: body.type,
        certificateTypeId: body.certificateTypeId,
        htmlContent: body.htmlContent,
        cssStyles: body.cssStyles,
        layout: body.layout,
        placeholders: body.placeholders,
      },
      body.createdBy
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al crear plantilla de certificado' },
      { status: 500 }
    );
  }
}
