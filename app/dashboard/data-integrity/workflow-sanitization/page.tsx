"use client";

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  Loader2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import type {
  CertificateWorkflowSanitationIssue,
  CertificateWorkflowSanitationReport,
  CertificateWorkflowSanitationSummary,
} from '@/lib/types/certificateWorkflowSanitation';

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

function StrategyBanner({ summary }: { summary: CertificateWorkflowSanitationSummary }) {
  const alerts: string[] = [];

  if (summary.publishedWithoutSignature > 0) {
    alerts.push('Hay certificados publicados sin firma válida; esos no deberían permanecer como emitidos o disponibles.');
  }

  if (summary.readyForAvailable > 0) {
    alerts.push('Ya existen certificados emitidos que sí cumplen condiciones para migrarse a Disponible.');
  }

  if (summary.legacyStatuses > 0) {
    alerts.push('Persisten estados legacy que conviene retirar del modelo nuevo.');
  }

  if (alerts.length === 0) {
    alerts.push('No se detectaron desviaciones graves entre firma, emisión y publicación.');
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <h2 className="text-lg font-black text-blue-950">Flujo objetivo de saneamiento</h2>
      <div className="mt-3 space-y-2 text-sm text-blue-900">
        <p>1. `borrador` → `espera_verificacion` → `verificado` → `espera_firma` → `firmado` → `emitido` → `disponible`.</p>
        <p>2. `emitido` significa: documento final generado y cerrado internamente.</p>
        <p>3. `disponible` significa: publicación final habilitada para participante y validación pública.</p>
        <p>4. Si un certificado publicado no tiene firma, PDF o plantilla válida, debe volver al estado recomendado y rehacerse el tramo final.</p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-blue-900">
        {alerts.map((message) => (
          <p key={message}>- {message}</p>
        ))}
      </div>
    </div>
  );
}

function ExecutionPlanCard() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <SectionHeader
        icon={<ShieldCheck size={20} />}
        title="Ruta recomendada de saneamiento"
        subtitle="Orden sugerido para limpiar la base y migrar el flujo sin borrar certificados existentes."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-black uppercase tracking-wide text-gray-500">Decisión base</p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p>- No borrar certificados emitidos ni recrear la base.</p>
            <p>- Migrar en sitio los estados y reparar solo los documentos inconsistentes.</p>
            <p>- Mantener la trazabilidad histórica y registrar cada corrección como saneamiento.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black uppercase tracking-wide text-blue-800">Flujo objetivo</p>
          <div className="mt-3 space-y-2 text-sm text-blue-900">
            <p>- `draft` → `pending_review` → `verified` → `pending_signature`.</p>
            <p>- `signed` → `issued` cuando el PDF final ya existe.</p>
            <p>- `available` solo cuando ya puede verse y descargarse externamente.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 md:col-span-2">
          <p className="text-sm font-black uppercase tracking-wide text-amber-800">Ejecución sugerida</p>
          <div className="mt-3 space-y-2 text-sm text-amber-900">
            <p>1. Revertir primero los certificados publicados que no tengan firma, PDF o plantilla válida.</p>
            <p>2. Limpiar los estados legacy (`active`, `revoked`, `expired`) y mapearlos al modelo nuevo.</p>
            <p>3. Solo después migrar a `available` los certificados que ya estén completos.</p>
            <p>4. Al final endurecer el código para que ningún certificado vuelva a saltarse firma o emisión real.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: CertificateWorkflowSanitationIssue['severity'] }) {
  const className =
    severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${className}`}>
      {severity === 'high' ? 'Alta' : 'Media'}
    </span>
  );
}

export default function WorkflowSanitizationPage() {
  const [report, setReport] = useState<CertificateWorkflowSanitationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-integrity/certificate-workflow');
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible cargar la auditoría de workflow.');
      }

      setReport(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar la auditoría de workflow.'
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
            <p className="font-bold text-gray-900">Analizando saneamiento del workflow</p>
            <p className="text-sm text-gray-500">
              Revisando firmas, PDF final, plantillas y estados legacy.
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
          <Link
            href="/dashboard/data-integrity"
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            Volver a Integridad de Datos
          </Link>
          <h1 className="text-3xl font-black tracking-tighter text-primary">
            Saneamiento de Workflow
          </h1>
          <p className="mt-1 max-w-3xl text-gray-500">
            Diagnóstico de certificados que deben volver atrás para rehacer firma, emisión o publicación bajo el nuevo flujo.
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
          <StrategyBanner summary={report.summary} />
          <ExecutionPlanCard />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Certificados publicados" value={report.summary.publishedCertificates} />
            <SummaryCard
              label="Candidatos a saneamiento"
              value={report.summary.sanitationCandidates}
              tone={report.summary.sanitationCandidates > 0 ? 'danger' : 'success'}
            />
            <SummaryCard
              label="Publicados sin firma"
              value={report.summary.publishedWithoutSignature}
              tone={report.summary.publishedWithoutSignature > 0 ? 'danger' : 'success'}
            />
            <SummaryCard
              label="Publicados sin PDF"
              value={report.summary.publishedWithoutPdf}
              tone={report.summary.publishedWithoutPdf > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Publicados sin plantilla"
              value={report.summary.publishedWithoutTemplate}
              tone={report.summary.publishedWithoutTemplate > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Firmados sin firma"
              value={report.summary.signedWithoutSignature}
              tone={report.summary.signedWithoutSignature > 0 ? 'danger' : 'success'}
            />
            <SummaryCard
              label="Espera firma sin solicitud"
              value={report.summary.pendingSignatureWithoutRequest}
              tone={report.summary.pendingSignatureWithoutRequest > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Listos para Disponible"
              value={report.summary.readyForAvailable}
              tone="success"
            />
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<FileWarning size={20} />}
              title="Certificados para saneamiento inmediato"
              subtitle="Aquí están los certificados que no deberían seguir en su estado actual y el punto al que conviene regresarlos."
            />

            {report.sanitationCandidates.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={18} />}
                title="No hay certificados que deban retroceder"
                description="Los estados actuales no muestran desviaciones críticas entre firma, PDF, plantilla y publicación."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Participante</th>
                      <th className="px-4 py-3">Estado actual</th>
                      <th className="px-4 py-3">Hallazgos</th>
                      <th className="px-4 py-3">Estado recomendado</th>
                      <th className="px-4 py-3">Acciones sugeridas</th>
                      <th className="px-4 py-3 text-right">Abrir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.sanitationCandidates.map((item) => (
                      <tr key={item.certificateId}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                          <div>{item.folio}</div>
                          <div className="mt-2">
                            <SeverityBadge severity={item.severity} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{item.studentName}</p>
                          <p className="text-xs text-gray-400">{item.studentId}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-semibold">{item.currentStatus}</div>
                          <div className="text-xs text-gray-400">
                            Solicitud: {item.signatureRequestStatus || 'sin solicitud'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {item.findings.map((finding) => (
                              <p key={finding} className="text-red-700">
                                - {finding}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            {item.recommendedState}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {item.cleanupActions.map((action) => (
                              <p key={action} className="text-gray-700">
                                - {action}
                              </p>
                            ))}
                          </div>
                        </td>
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

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<Rocket size={20} />}
                title="Candidatos para migrar a Disponible"
                subtitle="Certificados que ya cumplen requisitos y podrían pasar del modelo viejo a `available`."
              />

              {report.readyForAvailable.length === 0 ? (
                <EmptyState
                  icon={<Sparkles size={18} />}
                  title="No hay candidatos listos"
                  description="Todavía no existen certificados emitidos que cumplan todo para promocionarse a Disponible."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Estado actual</th>
                        <th className="px-4 py-3">Objetivo</th>
                        <th className="px-4 py-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.readyForAvailable.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{item.folio}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-400">{item.studentId}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.currentStatus}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              {item.targetState}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.notes.map((note) => (
                              <p key={note} className="text-gray-700">
                                - {note}
                              </p>
                            ))}
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
                icon={<ShieldCheck size={20} />}
                title="Estados legacy detectados"
                subtitle="Estados que conviene retirar del modelo una vez termine la migración al flujo nuevo."
              />

              {report.legacyStatuses.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay estados legacy activos"
                  description="La base ya no muestra estados antiguos en los certificados revisados."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Estado legacy</th>
                        <th className="px-4 py-3">Recomendación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.legacyStatuses.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{item.folio}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-400">{item.studentId}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.currentStatus}</td>
                          <td className="px-4 py-3 text-gray-700">{item.recommendation}</td>
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
