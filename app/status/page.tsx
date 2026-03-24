import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ChevronRight, AlertCircle, Clock, FileCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { consultCertificates } from '@/app/actions/consult-certificates';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estado de Solicitud - SIGCE',
  description: 'Consulta el estado de tus trámites y certificaciones en tiempo real.',
};

interface PageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function StatusPage({ searchParams }: PageProps) {
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
        
        {/* Header / Search Bar Context */}
        <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-primary mb-6">
                <Clock className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--primary)] mb-4">Estado de Solicitud</h1>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
                Verifique el estado de sus trámites y certificaciones. Ingrese su matrícula o número de folio para consultar el progreso.
            </p>
            
            {/* Simple Search Bar Reuse for Context */}
            <form action="/status" method="GET" className="max-w-lg mx-auto relative group">
                <Search className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
                <input 
                    name="query"
                    defaultValue={query}
                    type="text" 
                    placeholder="Matrícula o Folio de Solicitud..." 
                    className="w-full pl-12 pr-32 h-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                />
                <Button type="submit" className="absolute right-1 top-1 bottom-1 px-6 rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20">
                    Consultar
                </Button>
            </form>
        </div>

        {/* Results Section */}
        {query ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {error ? (
                     <div className="max-w-lg mx-auto p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">No se encontraron solicitudes</h3>
                        <p className="text-red-600/80">{error}</p>
                        <Link href="/">
                            <Button variant="link" className="text-red-700 mt-2">Volver al inicio</Button>
                        </Link>
                     </div>
                ) : results && results.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">
                                Solicitudes Encontradas ({results.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {results.map((cert) => (
                                <Card key={cert.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${cert.status === 'valid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {cert.status === 'valid' ? <FileCheck size={24} /> : <XCircle size={24} />}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    Certificado {cert.folio}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                    {cert.statusLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Resultado: <span className="font-medium text-gray-700">{cert.message}</span>
                                            </p>
                                        </div>

                                        <div className="text-right min-w-[140px]">
                                            <div className={`text-sm font-bold uppercase tracking-wide mb-1 ${cert.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                                {cert.isValid ? 'Valido' : 'No disponible'}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Actualizado: {new Date(cert.issueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div>
                                             <Link href={`/verify/${cert.verificationCode || cert.folio}`}>
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    Ver Detalles <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                             </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No hay resultados para mostrar.</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center opacity-60">
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">1</div>
                    <h3 className="font-bold text-sm text-gray-700">Ingrese Datos</h3>
                    <p className="text-xs text-gray-400 mt-1">Digite su matrícula o folio</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">2</div>
                    <h3 className="font-bold text-sm text-gray-700">Verifique Estado</h3>
                    <p className="text-xs text-gray-400 mt-1">Consulte el progreso actual</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">3</div>
                    <h3 className="font-bold text-sm text-gray-700">Descargue</h3>
                    <p className="text-xs text-gray-400 mt-1">Obtenga su documento final</p>
                </div>
            </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
