import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
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
        <div className="mb-8 text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
              certificate.isValid
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {certificate.isValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {certificate.isValid ? 'Certificado válido' : 'Certificado no vigente'}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-primary">
            Resultado de validación pública
          </h1>
          <p className="mt-2 text-gray-600">
            Esta vista pública solo confirma la autenticidad del folio registrado en SIGCE.
          </p>
        </div>

        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <CardContent className="p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    <ShieldCheck className="h-4 w-4" />
                    Validación SIGCE
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {certificate.message}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    El detalle visual del certificado y la descarga del documento
                    se encuentran protegidos dentro del portal autenticado del participante.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Folio
                    </p>
                    <p className="mt-2 font-mono text-sm font-bold text-gray-800">
                      {certificate.folio}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Estado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      {certificate.statusLabel}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Código de verificación
                    </p>
                    <p className="mt-2 break-all font-mono text-sm font-bold text-gray-800">
                      {certificate.verificationCode || 'No disponible'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Fecha de emisión registrada
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      {formatIssueDate(certificate.issueDate)}
                    </p>
                  </div>
                </div>
              </div>

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
