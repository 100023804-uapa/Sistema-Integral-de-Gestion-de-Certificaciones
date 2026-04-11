import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, LockKeyhole, ShieldCheck, BookOpen, Hash, Calendar } from 'lucide-react';
import { findPublicCertificateValidation } from '@/lib/server/studentPortal';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatIssueDate(issueDate: string) {
  return new Date(issueDate).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function CertificateValidationPage({ params }: PageProps) {
  const { id } = await params;
  const certificate = await findPublicCertificateValidation(decodeURIComponent(id));

  if (!certificate) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-10">
        {/* Header badge */}
        <div className="mb-8 text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide ${
              certificate.isValid
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {certificate.isValid ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {certificate.isValid ? 'Certificado vigente' : 'Certificado no vigente'}
          </div>
        </div>

        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            {/* Top section — Validation message */}
            <div className="border-b border-gray-100 bg-white p-8 md:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                Validación SIGCE
              </div>
              <p className="text-base leading-7 text-gray-700">
                Este certificado se encuentra registrado y validado en
                <strong className="text-primary"> SIGCE </strong>
                como emisión oficial de la
                <strong className="text-primary"> Universidad Abierta para Adultos (UAPA)</strong>.
              </p>
            </div>

            {/* Main content grid */}
            <div className="grid gap-6 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
              {/* Left side — Certificate info */}
              <div className="space-y-5">
                {/* Program Name */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Programa o curso cursado
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {certificate.programName}
                  </p>
                  {certificate.type && (
                    <div className="mt-4 border-t border-gray-200/60 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                        Tipo de certificado
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        {certificate.type}
                      </p>
                    </div>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Status */}
                  {certificate.isValid && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Estado
                      </p>
                      <p className={`mt-2 text-sm font-bold ${
                        certificate.isValid ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {certificate.statusLabel}
                      </p>
                    </div>
                  )}

                  {/* Folio */}
                  <div className={`rounded-2xl border border-gray-100 bg-gray-50 p-4 ${certificate.isValid ? '' : 'sm:col-span-2'}`}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Folio
                      </p>
                    </div>
                    <p className="mt-2 font-mono text-sm font-bold text-gray-800">
                      {certificate.folio}
                    </p>
                  </div>

                  {/* Verification Code */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Código de verificación
                    </p>
                    <p className="mt-2 break-all font-mono text-sm font-bold text-gray-800">
                      {certificate.verificationCode || 'No disponible'}
                    </p>
                  </div>

                  {/* Issue Date */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Fecha de emisión registrada
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      {formatIssueDate(certificate.issueDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side — Protected document + CTA */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-800">
                    <LockKeyhole className="h-4 w-4" />
                    Documento protegido
                  </div>
                  <p className="text-sm leading-6 text-amber-900">
                    Para ver el certificado completo, descargarlo o gestionar solicitudes,
                    el participante debe ingresar al portal con su cuenta activada.
                  </p>
                  <div className="mt-5">
                    <Link href="/login">
                      <Button>Ingresar al portal</Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    ¿Necesitas confirmar el documento con el titular?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Solicita al participante que acceda al portal autenticado para
                    compartir o descargar el certificado desde su propia cuenta.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
