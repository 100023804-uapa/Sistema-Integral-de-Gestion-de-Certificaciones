import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { consultCertificates } from '@/app/actions/consult-certificates';

export const metadata: Metadata = {
  title: 'Validar Certificado - SIGCE',
  description:
    'Valida la autenticidad de un certificado académico mediante folio o código de verificación.',
};

interface PageProps {
  searchParams: Promise<{ query?: string }>;
}

function formatIssueDate(issueDate: string) {
  return new Date(issueDate).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { query } = await searchParams;

  let results = null;
  let error = null;

  if (query) {
    const response = await consultCertificates(query);
    if (response.success) {
      results = response.data;
    } else {
      error = response.error;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Validación pública
          </div>
          <h1 className="mb-4 text-3xl font-bold text-[var(--primary)]">
            Verifica la autenticidad del certificado
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-gray-500">
            Ingresa el folio o el código de verificación para confirmar si el
            certificado existe y se encuentra vigente en SIGCE.
          </p>

          <form action="/verify" method="GET" className="relative mx-auto max-w-lg">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              name="query"
              defaultValue={query}
              type="text"
              placeholder="Ej. SIGCE-2026-CAP-0001 o HASH-ABCD1234"
              className="h-12 w-full rounded-xl border border-gray-200 pl-12 pr-32 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[var(--accent)]"
            />
            <Button
              type="submit"
              className="absolute bottom-1 right-1 top-1 rounded-lg px-6 text-sm font-bold shadow-lg shadow-orange-500/20"
            >
              Validar
            </Button>
          </form>
        </div>

        {query ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error ? (
              <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-red-800">
                  No se encontró el certificado
                </h3>
                <p className="text-red-700/80">{error}</p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-6">
                {results.map((cert) => (
                  <Link
                    href={`/verify/${encodeURIComponent(cert.verificationCode || cert.folio)}`}
                    key={cert.id}
                    className="block group"
                  >
                    <Card className="overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-mono font-bold text-primary">
                            {cert.folio}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              cert.isValid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {cert.statusLabel}
                          </span>
                        </div>

                        <p className="mb-2 text-lg font-bold text-gray-900">
                          {cert.message}
                        </p>
                        <div className="space-y-1 text-sm text-gray-500">
                          <p>Emitido: {formatIssueDate(cert.issueDate)}</p>
                          <p>
                            Código: {cert.verificationCode || 'No disponible'}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center font-bold text-[var(--accent)] transition-transform group-hover:translate-x-1">
                          Ver detalle de validación
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="py-12 text-center opacity-60">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg text-gray-400">
              Ingresa un folio o código para comenzar la validación
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
