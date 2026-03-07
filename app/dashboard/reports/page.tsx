"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Loader2, Download, FileText, CheckCircle2, AlertTriangle, Clock3, Filter } from 'lucide-react';
import { getCertificateRepository, getListCampusesUseCase, getListAcademicAreasUseCase } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';
import { Campus } from '@/lib/container';
import { AcademicArea } from '@/lib/container';

interface MonthlyPoint {
  label: string;
  count: number;
}

import { useDataScope } from '@/hooks/use-data-scope';

export default function ReportsPage() {
  const router = useRouter();
  const certRepo = getCertificateRepository();
  const { canAccess, scope } = useDataScope();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [areas, setAreas] = useState<AcademicArea[]>([]);
  const [error, setError] = useState('');

  // Filtros
  const [filters, setFilters] = useState({
    campusId: '',
    academicAreaId: '',
    status: '',
    type: ''
  });

  // Efecto para pre-establecer filtros según el alcance
  useEffect(() => {
    if (scope.type === 'campus' && scope.campusIds.length === 1) {
      setFilters(prev => ({ ...prev, campusId: scope.campusIds[0] }));
    }
    if (scope.type === 'area' && scope.academicAreaIds.length === 1) {
      setFilters(prev => ({ ...prev, academicAreaId: scope.academicAreaIds[0] }));
    }
  }, [scope]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [filters, scope]);

  const loadInitialData = async () => {
    try {
      const campusUseCase = getListCampusesUseCase();
      const areaUseCase = getListAcademicAreasUseCase();
      
      const [campusData, areaData] = await Promise.all([
        campusUseCase.execute(true),
        areaUseCase.execute()
      ]);

      // Filtrar catálogos según alcance para los selectores
      let filteredCampuses = campusData;
      let filteredAreas = areaData;

      if (scope.type === 'campus') {
        filteredCampuses = campusData.filter(c => scope.campusIds.includes(c.id));
      } else if (scope.type === 'area') {
        filteredAreas = areaData.filter(a => scope.academicAreaIds.includes(a.id));
      }

      setCampuses(filteredCampuses);
      setAreas(filteredAreas);
    } catch (err) {
      console.error('Error loading initial report data:', err);
    }
  };

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await certRepo.listPaginated(undefined, 1000); // Aumentamos para reportes
      let filtered = result.data.filter(c => canAccess(c));

      if (filters.campusId) {
        filtered = filtered.filter(c => c.campusId === filters.campusId);
      }
      if (filters.academicAreaId) {
        filtered = filtered.filter(c => c.academicAreaId === filters.academicAreaId);
      }
      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      if (filters.type) {
        filtered = filtered.filter(c => c.type === filters.type);
      }

      setCertificates(filtered);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('No se pudieron cargar los datos para reportes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const report = useMemo(() => buildReport(certificates), [certificates]);

  const exportCsv = () => {
    const header = 'folio,studentName,studentId,type,status,academicProgram,issueDate';
    const rows = certificates.map((cert) => [
      cert.folio,
      cert.studentName,
      cert.studentId,
      cert.type,
      cert.status,
      cert.academicProgram,
      cert.issueDate.toISOString(),
    ].map(csvEscape).join(','));

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigce-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-black text-primary tracking-tighter">Reportes</h1>
        </div>

        <button
          onClick={exportCsv}
          disabled={certificates.length === 0 || loading}
          className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
          <Filter className="h-4 w-4" /> Filtros de Reporte
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Recinto</label>
            <select
              name="campusId"
              value={filters.campusId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">Todos los Recintos</option>
              {campuses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Área Académica</label>
            <select
              name="academicAreaId"
              value={filters.academicAreaId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">Todas las Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="revoked">Revocado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">Todos los Tipos</option>
              <option value="CAP">CAP</option>
              <option value="PROFUNDO">PROFUNDO</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={FileText} label="Certificados Analizados" value={report.total.toString()} />
            <MetricCard icon={CheckCircle2} label="Activos" value={report.active.toString()} tone="green" />
            <MetricCard icon={AlertTriangle} label="Revocados" value={report.revoked.toString()} tone="red" />
            <MetricCard icon={Clock3} label="Expirados" value={report.expired.toString()} tone="gray" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Emision por Tipo
              </h2>
              <div className="space-y-3 text-sm">
                <TypeRow label="CAP" value={report.byType.CAP} total={report.total} />
                <TypeRow label="PROFUNDO" value={report.byType.PROFUNDO} total={report.total} />
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Ultimos 6 Meses
              </h2>
              <div className="space-y-3">
                {report.monthly.map((point) => (
                  <div key={point.label} className="flex items-center gap-3 text-sm">
                    <div className="w-24 text-gray-500">{point.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${report.maxMonthly > 0 ? (point.count / report.maxMonthly) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="w-8 text-right font-bold text-gray-700">{point.count}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'red' | 'gray';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm text-gray-500 mt-3">{label}</p>
      <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
    </div>
  );
}

function TypeRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-gray-600">
        <span>{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function buildReport(certificates: Certificate[]) {
  const total = certificates.length;
  const active = certificates.filter((c) => c.status === 'active').length;
  const revoked = certificates.filter((c) => c.status === 'revoked').length;
  const expired = certificates.filter((c) => c.status === 'expired').length;

  const byType = {
    CAP: certificates.filter((c) => c.type === 'CAP').length,
    PROFUNDO: certificates.filter((c) => c.type === 'PROFUNDO').length,
  };

  const monthly = lastSixMonths().map((entry) => {
    const count = certificates.filter((cert) => {
      const date = cert.issueDate;
      return date.getFullYear() === entry.year && date.getMonth() === entry.month;
    }).length;

    return {
      label: entry.label,
      count,
    };
  });

  const maxMonthly = monthly.reduce((max, point) => Math.max(max, point.count), 0);

  return { total, active, revoked, expired, byType, monthly, maxMonthly };
}

function lastSixMonths(): Array<{ label: string; month: number; year: number }> {
  const formatter = new Intl.DateTimeFormat('es-DO', { month: 'short', year: '2-digit' });
  const output: Array<{ label: string; month: number; year: number }> = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    output.push({
      label: formatter.format(date),
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }

  return output;
}

function csvEscape(value: string): string {
  const normalized = value ?? '';
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}
