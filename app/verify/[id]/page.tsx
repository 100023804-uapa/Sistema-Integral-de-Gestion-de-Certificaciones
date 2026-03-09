import { CheckCircle, Award, Calendar, Hash, Layers3 } from 'lucide-react';
import { notFound } from 'next/navigation';

import { CertificateActions } from '@/components/certificates/CertificateActions';
import { RenderedCertificatePreview } from '@/components/certificates/RenderedCertificatePreview';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  RenderedCertificateTemplate,
  renderCertificateTemplate,
} from '@/lib/application/utils/certificate-template-renderer';
import { buildTemplateFromCertificateSnapshot } from '@/lib/application/utils/certificate-template-snapshot';
import { getCertificateRepository, getTemplateRepository } from '@/lib/container';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function findCertificate(id: string) {
  const repository = getCertificateRepository();

  let certificate = await repository.findById(id);

  if (!certificate) {
    certificate = await repository.findByFolio(id);
  }

  if (!certificate) {
    certificate = await repository.findByFolio(id.toUpperCase());
  }

  if (!certificate) {
    certificate = await repository.findByVerificationCode(id);
  }

  if (!certificate) {
    certificate = await repository.findByVerificationCode(id.toUpperCase());
  }

  return certificate;
}

function buildVerificationUrl(certificate: {
  qrCodeUrl?: string;
  publicVerificationCode?: string;
  folio: string;
}) {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://sigce.app';
  return certificate.qrCodeUrl || `${baseUrl}/verify/${certificate.publicVerificationCode || certificate.folio}`;
}

function getRenderModeLabel(renderedTemplate: RenderedCertificateTemplate) {
  if (renderedTemplate.mode === 'html') return 'HTML';
  if (renderedTemplate.mode === 'legacy') return 'LEGACY';
  return 'DEFAULT';
}

export default async function CertificateDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  const certificate = await findCertificate(id);
  if (!certificate) return notFound();

  const templateRepository = getTemplateRepository();
  const template = certificate.templateSnapshot
    ? buildTemplateFromCertificateSnapshot(certificate.templateSnapshot)
    : certificate.templateId
      ? await templateRepository.findById(certificate.templateId)
      : null;
  const verificationUrl = buildVerificationUrl(certificate);
  const renderedTemplate = await renderCertificateTemplate(template, certificate, {
    verificationUrl,
  });

  const serializedCertificate = JSON.parse(JSON.stringify(certificate));
  const serializedTemplate = template ? JSON.parse(JSON.stringify(template)) : null;
  const templateName = certificate.templateSnapshot?.name || template?.name || null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-100 px-4 py-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-bold uppercase tracking-wider text-green-700">Certificado validado</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="overflow-hidden border border-slate-200 shadow-lg">
              <CardHeader className="border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Vista del certificado</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Esta validacion publica usa la misma plantilla renderizada del certificado emitido.
                    </p>
                  </div>
                  <div className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                    {getRenderModeLabel(renderedTemplate)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <RenderedCertificatePreview
                  renderedTemplate={renderedTemplate}
                  title="Vista publica del certificado"
                  minHeightClassName="min-h-[82vh] lg:min-h-[86vh]"
                  maxScale={1.45}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Datos de validacion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Titular</span>
                    <span className="text-right font-semibold text-slate-900">{certificate.studentName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Programa</span>
                    <span className="text-right font-semibold text-slate-900">{certificate.academicProgram}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Folio</span>
                    <span className="text-right font-mono text-xs text-slate-700">{certificate.folio}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Codigo publico</span>
                    <span className="text-right font-mono text-xs font-semibold text-[var(--accent)]">
                      {certificate.publicVerificationCode || certificate.folio}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Fecha de emision</span>
                    <span className="text-right font-semibold text-slate-900">
                      {certificate.issueDate.toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {templateName && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">Plantilla</span>
                      <span className="text-right text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {templateName}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Metadatos reales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Area academica</p>
                      <p className="font-medium text-slate-900">
                        {certificate.metadata?.academicArea || certificate.academicAreaId || 'No especificada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Recinto</p>
                      <p className="font-medium text-slate-900">
                        {certificate.metadata?.campusName || certificate.campusId || 'No especificado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Duracion</p>
                      <p className="font-medium text-slate-900">
                        {certificate.metadata?.duration || 'No especificada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">URL de verificacion</p>
                      <p className="break-all font-mono text-[11px] text-slate-600">{verificationUrl}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <CertificateActions certificate={serializedCertificate} template={serializedTemplate} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
