import { NextRequest, NextResponse } from 'next/server';
import { getGenerateCertificateUseCase } from '@/lib/container';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const generateCertificateUseCase = getGenerateCertificateUseCase();
    const generatedCertificate = await generateCertificateUseCase.execute(
      body.certificateId,
      body.templateId,
      {
        includeQR: body.includeQR !== false,
        includeSignature: body.includeSignature !== false,
        watermark: body.watermark || false,
        quality: body.quality || 'medium'
      },
      body.generatedBy
    );

    return NextResponse.json({ 
      success: true, 
      data: generatedCertificate 
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al generar certificado' },
      { status: 500 }
    );
  }
}
