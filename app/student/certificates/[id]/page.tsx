import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertTriangle, ArrowLeft, Calendar, FileBadge, ShieldCheck } from 'lucide-react';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import {
  getStudentCertificateDetail,
  resolveSessionAccessFromSessionCookie,
} from '@/lib/server/studentPortal';
import { StudentLogoutButton } from '@/components/student/StudentLogoutButton';
import { CertificateActions } from '@/components/certificates/CertificateActions';

interface StudentCertificateDetailsPageProps {
  params: Promise<{ id: string }>;
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function StudentCertificateDetailsPage({
  params,
}: StudentCertificateDetailsPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    redirect('/login?next=/student');
  }

  const access = await resolveSessionAccessFromSessionCookie(sessionCookie);

  if (access.internalAccess) {
    redirect('/dashboard');
  }

  if (!access.studentAccess) {
    redirect('/login');
  }

  if (access.student?.mustChangePassword) {
    redirect('/student/change-password');
  }

  if (!access.student) {
    redirect('/student');
  }

  const certificate = await getStudentCertificateDetail(
    access.student.studentId,
    decodeURIComponent(id)
  );

  if (!certificate) {
    notFound();
  }

  const publicValidationUrl = `/verify/${encodeURIComponent(
    certificate.verificationCode || certificate.folio
  )}`;

  const certificateForPdf = {
    id: certificate.id,
    folio: certificate.folio,
    studentId: certificate.studentId,
    studentName: certificate.studentName || access.student.fullName,
    type: certificate.type === 'PROFUNDO' ? 'PROFUNDO' : 'CAP',
    academicProgram: certificate.programName,
    issueDate: certificate.issueDate,
    status: certificate.status,
    qrCodeUrl: certificate.qrCodeUrl,
    publicVerificationCode: certificate.verificationCode,
    pdfUrl: certificate.pdfUrl,
    campusId: '',
    metadata: certificate.metadata,
    createdAt: certificate.issueDate,
    updatedAt: certificate.issueDate,
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/student"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al portal de estudiante
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-primary">
              Detalle del certificado
            </h1>
            <p className="text-gray-600">
              Documento disponible solo dentro de tu sesión autenticada.
            </p>
          </div>
          <StudentLogoutButton />
        </div>

        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 bg-white p-8 md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold uppercase tracking-wide text-green-700">
              <ShieldCheck className="h-4 w-4" />
              {certificate.statusLabel}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                Certificado académico
              </p>
              <h2 className="text-3xl font-black leading-tight text-primary md:text-4xl">
                {certificate.programName}
              </h2>
              <p className="text-lg text-gray-700">
                Emitido a <span className="font-bold">{certificate.studentName || access.student.fullName}</span>
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                  Fecha de emisión
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {formatLongDate(certificate.issueDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Código de verificación
                </p>
                <p className="mt-2 font-mono text-sm font-bold text-gray-800">
                  {certificate.verificationCode || 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div className="space-y-6">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-800">
                  <FileBadge className="h-4 w-4" />
                  Acceso autenticado
                </div>
                <p className="text-sm leading-6 text-blue-900">
                  {certificate.canDownload
                    ? 'Desde este portal puedes ver y descargar tu certificado. La validacion publica solo confirma si el folio existe y esta vigente.'
                    : 'Desde este portal puedes consultar el estado de tu certificado. La validacion publica solo confirma si el folio existe y si esta habilitado.'}
                </p>
                <div className="mt-4">
                  <Link href={publicValidationUrl}>
                    <Button variant="secondary">Abrir validación pública</Button>
                  </Link>
                </div>
              </div>

              {certificate.restriction?.active && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Restriccion activa
                  </div>
                  <p className="text-sm leading-6 text-amber-900">
                    Este certificado tiene una restriccion por{' '}
                    <span className="font-bold">
                      {certificate.restriction.typeLabel}
                    </span>
                    . Mientras permanezca activa no podras descargar el documento.
                  </p>
                  <p className="mt-3 text-sm text-amber-900/90">
                    Motivo registrado: {certificate.restriction.reason}
                  </p>
                </div>
              )}

              <div className="rounded-3xl border border-gray-100 bg-white p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                  Resumen del documento
                </h3>
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">Fecha oficial</p>
                      <p>{formatLongDate(certificate.issueDate)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Titular</p>
                    <p>{certificate.studentName || access.student.fullName}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Programa</p>
                    <p>{certificate.programName}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Estado actual</p>
                    <p>{certificate.statusLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border border-gray-100 shadow-none">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                    Descarga del certificado
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    {certificate.availabilityMessage}
                  </p>
                  <CertificateActions
                    certificate={certificateForPdf}
                    allowShare={false}
                    allowEmail={false}
                    shareUrl={publicValidationUrl}
                    downloadLabel="Descargar certificado"
                    downloadUrl={`/api/student/certificates/${encodeURIComponent(certificate.id)}/download`}
                    canDownload={certificate.canDownload}
                    disabledReason={certificate.availabilityMessage}
                  />
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
