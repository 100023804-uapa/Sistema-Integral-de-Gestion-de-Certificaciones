"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Filter, Loader2, FileText, Calendar, User, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getCertificateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';

export default function CertificatesPage() {
  const router = useRouter();
  const repository = getCertificateRepository();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await repository.list();
        setCertificates(data);
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setError("Error al cargar los certificados.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">Certificados</h1>
          <p className="text-gray-500">Gestiona y consulta el historial de emisiones.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => {
                    const ws = XLSX.utils.json_to_sheet([
                        { Matricula: "2024-0001", Cedula: "402-1234567-8", Nombre: "Juan Perez", Email: "juan@ejemplo.com", Folio: "F-1234", Curso: "Software", Carrera: "Informática", Tipo: "CAP", Fecha: "2024-01-20" },
                        { Matricula: "2024-0002", Cedula: "001-9876543-2", Nombre: "Maria Garcia", Email: "maria@ejemplo.com", Folio: "F-1235", Curso: "Redes", Carrera: "Telemática", Tipo: "PROFUNDO", Fecha: "2024-01-20" }
                    ]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
                    XLSX.writeFile(wb, "Plantilla_Carga_SIGCE.xlsx");
                }}
                className="px-4 py-3 rounded-xl bg-green-50 text-green-700 font-bold border border-green-100 hover:bg-green-100 transition-colors flex items-center gap-2"
            >
                <FileSpreadsheet size={20} /> Plantilla
            </button>
            <button 
                onClick={() => router.push('/dashboard/certificates/import')}
                className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
            >
                <FileText size={20} /> Importar Excel
            </button>
            <button 
                onClick={() => router.push('/dashboard/certificates/create')}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
                <PlusCircle size={20} /> Nuevo Certificado
            </button>
        </div>
      </div>

      {/* Filters & Search - Visual Only for now */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Buscar por nombre, folio o programa..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
        </div>
        <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 font-medium">
            <Filter size={18} /> Filtros
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-400">Cargando certificados...</p>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-8">
                <p className="text-red-500">{error}</p>
                 <button onClick={() => window.location.reload()} className="text-primary underline">Intentar de nuevo</button>
            </div>
        ) : certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-8">
                <div className="bg-gray-50 p-6 rounded-full inline-block">
                    <Search className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No hay certificados aún</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Comienza emitiendo el primer certificado para visualizarlo aquí.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Folio</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Estudiante</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Programa</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Fecha Emisión</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Estado</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {certificates.map((cert) => (
                            <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        {cert.folio}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {cert.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{cert.studentName}</p>
                                            <p className="text-xs text-gray-400">{cert.studentId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                    {cert.academicProgram}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cert.issueDate.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        cert.status === 'active' ? 'bg-green-100 text-green-800' :
                                        cert.status === 'revoked' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {cert.status === 'active' ? 'Activo' : cert.status === 'revoked' ? 'Revocado' : 'Expirado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => router.push(`/dashboard/certificates/${cert.id}`)}
                                        className="text-gray-400 hover:text-primary transition-colors font-medium text-sm"
                                    >
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
