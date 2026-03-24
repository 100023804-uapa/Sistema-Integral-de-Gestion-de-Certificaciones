import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, FileText, ShieldCheck, Calendar, AlertCircle } from 'lucide-react';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import {
  listStudentCertificates,
  resolveSessionAccessFromSessionCookie,
} from '@/lib/server/studentPortal';
import { StudentLogoutButton } from '@/components/student/StudentLogoutButton';

interface StudentPageProps {
  searchParams: Promise<{ search?: string }>;
}

function formatIssueDate(issueDate: string) {
  return new Date(issueDate).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function StudentPortalPage({ searchParams }: StudentPageProps) {
  const { search } = await searchParams;
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

  const student = access.student;

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
          <Card className="border border-amber-100 shadow-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cuenta sin vínculo de participante
              </h1>
              <p className="text-gray-600">
                La sesión está activa, pero este correo no está asociado a un
                participante registrado en SIGCE.
              </p>
              <p className="text-sm text-gray-500">
                Solicita al área administrativa que active tu acceso al portal de
                estudiante y confirme tu correo institucional o personal.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
                <StudentLogoutButton />
                <Link href="/verify">
                  <Button variant="ghost">Ir a validación pública</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const certificates = await listStudentCertificates(student.studentId, search);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Portal autenticado del participante
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary">
                Mis certificados
              </h1>
              <p className="text-gray-600">
                {student.fullName} · {student.email}
              </p>
              <p className="text-sm text-gray-500">
                Matrícula: <span className="font-semibold">{student.studentId}</span>
                {student.career ? ` · ${student.career}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/verify">
              <Button variant="ghost">Validación pública</Button>
            </Link>
            <StudentLogoutButton />
          </div>
        </div>

        <Card className="mb-8 border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <form action="/student" method="GET" className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  name="search"
                  defaultValue={search}
                  type="text"
                  placeholder="Buscar por folio, programa o código de verificación"
                  className="h-12 w-full rounded-xl border border-gray-200 pl-12 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <Button type="submit" className="h-12 px-6 font-bold">
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {certificates.length === 0 ? (
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FileText className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                No hay certificados para mostrar
              </h2>
              <p className="mt-2 text-gray-600">
                {search
                  ? 'No encontramos certificados que coincidan con la búsqueda actual.'
                  : 'Todavía no tienes certificados habilitados dentro del portal.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {certificates.map((certificate) => (
              <Link
                key={certificate.id}
                href={`/student/certificates/${encodeURIComponent(certificate.id)}`}
                className="group block"
              >
                <Card className="h-full border border-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-mono font-bold text-primary">
                        {certificate.folio}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          certificate.canDownload
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {certificate.statusLabel}
                      </span>
                    </div>
                    <h2 className="mb-3 text-lg font-bold leading-tight text-gray-900 group-hover:text-primary">
                      {certificate.programName}
                    </h2>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Emitido el {formatIssueDate(certificate.issueDate)}
                      </p>
                      <p className="truncate">
                        Código: {certificate.verificationCode || 'No disponible'}
                      </p>
                    </div>
                    <div className="mt-5 border-t border-gray-100 pt-4 text-sm font-bold text-primary">
                      {certificate.canDownload ? 'Ver detalle y descarga' : 'Ver detalle y estado'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
