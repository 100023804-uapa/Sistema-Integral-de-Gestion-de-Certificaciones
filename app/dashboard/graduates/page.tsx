"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';

import type { StudentOverviewItem } from '@/lib/types/studentOverview';

type StudentOverviewPayload = {
  success: boolean;
  data?: StudentOverviewItem[];
  summary?: {
    totalStudents: number;
    totalWithCertificates: number;
    totalWithoutCertificates: number;
    totalPortalEnabled: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
};

const PAGE_SIZE = 20;

function getPortalStatusLabel(student: StudentOverviewItem) {
  if (!student.portalEnabled) {
    return 'Sin acceso';
  }

  return {
    invited: 'Temporal emitida',
    active: 'Activo',
    disabled: 'Deshabilitado',
    inactive: 'Inactivo',
  }[student.portalStatus];
}

function getPortalStatusClasses(student: StudentOverviewItem) {
  if (!student.portalEnabled) {
    return 'bg-gray-100 text-gray-700';
  }

  return {
    invited: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-700',
  }[student.portalStatus];
}

export default function GraduatesPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalWithCertificates: 0,
    totalWithoutCertificates: 0,
    totalPortalEnabled: 0,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setAppliedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (appliedSearch) {
          params.set('q', appliedSearch);
        }

        const response = await fetch(`/api/admin/students/overview?${params.toString()}`, {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as StudentOverviewPayload | null;

        if (!response.ok || !payload?.success || !payload.data || !payload.pagination || !payload.summary) {
          throw new Error(payload?.error || 'No fue posible cargar los participantes.');
        }

        if (!active) {
          return;
        }

        setStudents(payload.data);
        setSummary(payload.summary);
        setTotalPages(payload.pagination.totalPages);
        setHasMore(payload.pagination.hasMore);
        setTotalRows(payload.pagination.total);
      } catch (requestError) {
        if (!active) {
          return;
        }

        console.error('Error loading student overview:', requestError);
        setStudents([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No fue posible cargar los participantes.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, [appliedSearch, page]);

  const isSearching = appliedSearch.length > 0;

  const tableCaption = useMemo(() => {
    if (loading) {
      return 'Cargando participantes...';
    }

    if (isSearching) {
      return `${totalRows} resultado(s) para "${appliedSearch}".`;
    }

    return `${summary.totalStudents} participantes registrados, ${summary.totalWithCertificates} con certificados.`;
  }, [appliedSearch, isSearching, loading, summary.totalStudents, summary.totalWithCertificates, totalRows]);

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">Participantes</h1>
          <p className="text-gray-500">
            Consulta la base real de participantes y cuántos certificados tiene cada uno.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => router.push('/dashboard/graduates/import')}
            className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <FileText size={20} /> Importar Excel
          </button>
          <button
            onClick={() => router.push('/dashboard/graduates/create')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Nuevo Participante
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Participantes</p>
          <p className="text-2xl font-black text-primary">{summary.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Con certificados</p>
          <p className="text-2xl font-black text-green-600">{summary.totalWithCertificates}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sin certificados</p>
          <p className="text-2xl font-black text-amber-600">{summary.totalWithoutCertificates}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Portal habilitado</p>
          <p className="text-2xl font-black text-sky-600">{summary.totalPortalEnabled}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, matrícula, correo o cédula..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">{tableCaption}</div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500">Cargando participantes...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4 p-20">
            <div className="bg-red-50 p-6 rounded-full inline-block">
              <Search className="w-12 h-12 text-red-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No se pudo cargar la lista</h3>
            <p className="text-gray-500 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => {
                setPage(1);
                setAppliedSearch(searchInput.trim());
              }}
              className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center space-y-4 p-20">
            <div className="bg-gray-50 p-6 rounded-full inline-block">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No se encontraron participantes</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Intenta ajustar la búsqueda. Ahora el sistema consulta nombre, matrícula, correo y cédula.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Estudiante</th>
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Certificados</th>
                  <th className="px-6 py-4">Portal</th>
                  <th className="px-6 py-4">Fecha Registro</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-400">{student.email || 'Sin correo registrado'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      <div>{student.studentId}</div>
                      <div className="text-xs text-gray-400">{student.cedula || 'Sin cédula'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{student.certificateCount}</div>
                      <div className="text-xs text-gray-400">
                        {student.lastIssuedFolio ? `Último: ${student.lastIssuedFolio}` : 'Sin certificados'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${getPortalStatusClasses(student)}`}
                      >
                        <ShieldCheck size={14} />
                        {getPortalStatusLabel(student)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/graduates/${encodeURIComponent(student.studentId)}`)
                        }
                        className="text-primary font-bold hover:underline"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalRows > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={!hasMore}
                className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
