"use client";

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Unlink,
  Users,
} from 'lucide-react';

import type {
  StudentCertificateAuditReport,
  StudentCertificateAuditSummary,
} from '@/lib/types/studentCertificateAudit';

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-DO');
}

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-green-100 bg-green-50 text-green-900'
      : tone === 'warning'
        ? 'border-amber-100 bg-amber-50 text-amber-900'
        : tone === 'danger'
          ? 'border-red-100 bg-red-50 text-red-900'
          : 'border-gray-100 bg-white text-gray-900';

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-green-900">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm text-green-800">{description}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function RecommendationBanner({ summary }: { summary: StudentCertificateAuditSummary }) {
  const messages: string[] = [];

  if (summary.orphanCertificates > 0) {
    messages.push('Hay certificados que no apuntan a un participante real en la colección students.');
  }

  if (summary.certificatesBlockedForPortal > 0) {
    messages.push('Hay certificados vinculados a participantes que todavía no pueden entrar al portal.');
  }

  if (summary.certificatesWithNameMismatch > 0) {
    messages.push('Hay diferencias entre el nombre guardado en el certificado y la ficha actual del participante.');
  }

  if (messages.length === 0) {
    messages.push('La relación base entre participantes y certificados está consistente.');
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <h2 className="text-lg font-black text-blue-950">Cómo se vincula el portal realmente</h2>
      <div className="mt-3 space-y-2 text-sm text-blue-900">
        <p>1. El certificado se relaciona con el participante por `studentId`, no por nombre.</p>
        <p>2. El participante entra con su correo y una cuenta habilitada en `portalAccess`.</p>
        <p>3. Dentro del portal, la app solo muestra certificados cuyo `studentId` coincide con su ficha.</p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-blue-900">
        {messages.map((message) => (
          <p key={message}>- {message}</p>
        ))}
      </div>
    </div>
  );
}

export default function DataIntegrityPage() {
  const [report, setReport] = useState<StudentCertificateAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-integrity/student-certificates');
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible cargar la auditoría.');
      }

      setReport(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'No fue posible cargar la auditoría.'
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div>
            <p className="font-bold text-gray-900">Generando auditoría de integridad</p>
            <p className="text-sm text-gray-500">
              Revisando la relación entre participantes, certificados y acceso al portal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">
            Integridad de Datos
          </h1>
          <p className="mt-1 max-w-3xl text-gray-500">
            Diagnóstico operativo entre la ficha del participante, el certificado emitido y la
            posibilidad real de acceso al portal autenticado.
          </p>
          {report?.summary && (
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Última ejecución: {formatDate(report.summary.generatedAt)}
            </p>
          )}
        </div>
        <button
          onClick={() => void loadReport()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw size={18} />
          Actualizar auditoría
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Rutas de diagnóstico</h2>
            <p className="mt-1 text-sm text-gray-500">
              Desde aquí puedes revisar la relación participante-certificado y el saneamiento del flujo de estados.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              Participantes y portal
            </span>
            <Link
              href="/dashboard/data-integrity/workflow-sanitization"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Saneamiento de workflow
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-bold">No fue posible generar la auditoría</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {report && (
        <>
          <RecommendationBanner summary={report.summary} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Certificados totales" value={report.summary.totalCertificates} />
            <SummaryCard label="Participantes totales" value={report.summary.totalStudents} />
            <SummaryCard
              label="Certificados huérfanos"
              value={report.summary.orphanCertificates}
              tone={report.summary.orphanCertificates > 0 ? 'danger' : 'success'}
            />
            <SummaryCard
              label="Listos para portal"
              value={report.summary.certificatesReadyForPortal}
              tone="success"
            />
            <SummaryCard
              label="Bloqueados para portal"
              value={report.summary.certificatesBlockedForPortal}
              tone={report.summary.certificatesBlockedForPortal > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Sin studentId"
              value={report.summary.certificatesWithoutStudentId}
              tone={report.summary.certificatesWithoutStudentId > 0 ? 'danger' : 'success'}
            />
            <SummaryCard
              label="Nombres distintos"
              value={report.summary.certificatesWithNameMismatch}
              tone={report.summary.certificatesWithNameMismatch > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Participantes sin correo"
              value={report.summary.studentsMissingEmail}
              tone={report.summary.studentsMissingEmail > 0 ? 'warning' : 'success'}
            />
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Unlink size={20} />}
              title="Certificados sin participante válido"
              subtitle="Estos certificados no podrían resolverse correctamente en el portal del participante."
            />

            {report.orphanCertificates.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={18} />}
                title="No hay certificados huérfanos"
                description="Todos los certificados revisados tienen un studentId existente en la colección de participantes."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Nombre en certificado</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.orphanCertificates.map((item) => (
                      <tr key={item.certificateId}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                          {item.folio}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.studentId || 'Vacío'}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{item.studentName || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.status}</td>
                        <td className="px-4 py-3 text-red-700">{item.reason}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/certificates/${item.certificateId}`}
                            className="font-bold text-primary hover:underline"
                          >
                            Abrir certificado
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<ShieldAlert size={20} />}
              title="Certificados vinculados pero bloqueados para portal"
              subtitle="El certificado tiene participante, pero la ficha no permite todavía acceso real al portal."
            />

            {report.portalBlockedCertificates.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={18} />}
                title="No hay bloqueos de portal"
                description="Todo certificado vinculado tiene una ficha que ya podría autenticarse y consultar el portal."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Participante</th>
                      <th className="px-4 py-3">Correo</th>
                      <th className="px-4 py-3">Portal</th>
                      <th className="px-4 py-3">Bloqueos</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.portalBlockedCertificates.map((item) => (
                      <tr key={item.certificateId}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                          {item.folio}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{item.studentFullName}</p>
                          <p className="text-xs text-gray-500">
                            En certificado: {item.certificateStudentName || '-'}
                          </p>
                          <p className="text-xs text-gray-400">{item.studentId}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.studentEmail || 'Sin correo'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.portalStatus}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {item.blockers.map((blocker) => (
                              <p key={blocker} className="text-amber-700">
                                - {blocker}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="space-y-1">
                            <Link
                              href={`/dashboard/graduates/${encodeURIComponent(item.studentId)}`}
                              className="block font-bold text-primary hover:underline"
                            >
                              Abrir participante
                            </Link>
                            <Link
                              href={`/dashboard/certificates/${item.certificateId}`}
                              className="block font-bold text-gray-700 hover:underline"
                            >
                              Abrir certificado
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<Users size={20} />}
                title="Participantes sin certificados"
                subtitle="Fichas existentes que todavía no están referenciadas por ningún certificado."
              />

              {report.studentsWithoutCertificates.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay participantes sin certificados"
                  description="Toda ficha de participante está vinculada al menos a un certificado."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Matrícula</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Correo</th>
                        <th className="px-4 py-3">Portal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.studentsWithoutCertificates.slice(0, 25).map((item) => (
                        <tr key={item.studentId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                            {item.studentId}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/graduates/${encodeURIComponent(item.studentId)}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {item.studentFullName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.email || 'Sin correo'}</td>
                          <td className="px-4 py-3 text-gray-600">{item.portalStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<AlertTriangle size={20} />}
                title="Diferencias de nombre"
                subtitle="El certificado guarda un snapshot del nombre; aquí ves cuando ya no coincide con la ficha del participante."
              />

              {report.certificateNameMismatches.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay diferencias de nombre"
                  description="El nombre visible en los certificados coincide con la ficha actual del participante."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Matrícula</th>
                        <th className="px-4 py-3">Nombre en certificado</th>
                        <th className="px-4 py-3">Nombre en ficha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.certificateNameMismatches.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                            {item.folio}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.studentId}</td>
                          <td className="px-4 py-3 text-gray-800">
                            {item.certificateStudentName || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-800">{item.studentFullName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
