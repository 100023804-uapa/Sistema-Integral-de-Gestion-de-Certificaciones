"use client";

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileBadge2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  CertificateMetadataSanitationActionResult,
  CertificateMetadataSanitationReport,
  CertificateMetadataSanitationSummary,
} from '@/lib/types/certificateMetadataSanitation';

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

function RecommendationBanner({ summary }: { summary: CertificateMetadataSanitationSummary }) {
  const messages: string[] = [];

  if (summary.certificatesMissingTemplate > 0) {
    messages.push('Persisten certificados legacy sin plantilla oficial asignada.');
  }

  if (summary.certificatesMissingPrimarySigner > 0) {
    messages.push('Persisten certificados sin firmante institucional principal.');
  }

  if (summary.signersWithoutAuthorizedInternalUsers > 0) {
    messages.push('Hay firmantes institucionales sin usuarios internos autorizados por correo.');
  }

  if (summary.studentsMissingProgramId > 0 || summary.studentsMissingCampusId > 0) {
    messages.push('Los participantes todavía conservan huecos de catálogo que conviene cerrar después de sanear certificados.');
  }

  if (messages.length === 0) {
    messages.push('La base ya tiene completos los metadatos operativos mínimos para certificados y firmantes.');
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <h2 className="text-lg font-black text-blue-950">Objetivo del saneamiento</h2>
      <div className="mt-3 space-y-2 text-sm text-blue-900">
        <p>1. Todo certificado debe tener plantilla oficial, firmante institucional principal y luego pasar por firma operativa.</p>
        <p>2. Este saneamiento solo rellena faltantes. No sobreescribe certificados que ya tengan datos completos.</p>
        <p>3. El vínculo entre autoridad institucional y usuario interno firmante se resuelve por `allowedEmails`.</p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-blue-900">
        {messages.map((message) => (
          <p key={message}>- {message}</p>
        ))}
      </div>
    </div>
  );
}

export default function CertificateMetadataSanitationPage() {
  const [report, setReport] = useState<CertificateMetadataSanitationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [selectedSignerId, setSelectedSignerId] = useState('');
  const [signerEmailSelections, setSignerEmailSelections] = useState<Record<string, string>>({});

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-integrity/certificate-metadata');
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible cargar la auditoría de metadatos.');
      }

      const data = payload.data as CertificateMetadataSanitationReport;
      setReport(data);

      setSelectedSignerId((current) => {
        if (current && data.activeSigners.some((item) => item.id === current)) {
          return current;
        }

        return data.activeSigners.length === 1 ? data.activeSigners[0].id : '';
      });

      setSignerEmailSelections((current) => {
        const next = { ...current };
        for (const signer of data.activeSigners) {
          if (next[signer.id] && data.signingInternalUsers.some((item) => item.email === next[signer.id])) {
            continue;
          }

          next[signer.id] = '';
        }

        return next;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar la auditoría de metadatos.'
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const runAction = async (
    action:
      | 'apply_preferred_template'
      | 'assign_primary_signer'
      | 'authorize_signer_email'
      | 'apply_program_matches',
    body: Record<string, unknown>
  ) => {
    try {
      setRunningAction(action);

      const response = await fetch('/api/admin/data-integrity/certificate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...body }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible aplicar el saneamiento.');
      }

      const result = payload.data as CertificateMetadataSanitationActionResult;
      toast.success(result.message);
      await loadReport();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : 'No fue posible aplicar el saneamiento.'
      );
    } finally {
      setRunningAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div>
            <p className="font-bold text-gray-900">Auditando metadatos legacy</p>
            <p className="text-sm text-gray-500">
              Revisando plantilla oficial, firmantes y huecos de catálogo.
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
            Saneamiento de Metadatos
          </h1>
          <p className="mt-1 max-w-3xl text-gray-500">
            Alinea certificados legacy con la plantilla oficial, el firmante institucional principal y la autorización operativa por correo.
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
          <RecommendationBanner summary={report.summary} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Sin plantilla oficial"
              value={report.summary.certificatesMissingTemplate}
              tone={report.summary.certificatesMissingTemplate > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Sin firmante principal"
              value={report.summary.certificatesMissingPrimarySigner}
              tone={report.summary.certificatesMissingPrimarySigner > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Firmantes sin correos"
              value={report.summary.signersWithoutAllowedEmails}
              tone={report.summary.signersWithoutAllowedEmails > 0 ? 'warning' : 'success'}
            />
            <SummaryCard
              label="Participantes sin programa"
              value={report.summary.studentsMissingProgramId}
              tone={report.summary.studentsMissingProgramId > 0 ? 'danger' : 'success'}
            />
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Wrench size={20} />}
              title="Acciones seguras de saneamiento"
              subtitle="Estas acciones solo completan datos faltantes. No sobrescriben certificados que ya estén completos."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-sm font-black uppercase tracking-wide text-gray-500">Plantilla oficial</p>
                {report.preferredTemplate ? (
                  <>
                    <p className="mt-3 text-lg font-bold text-gray-900">{report.preferredTemplate.name}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Se aplicará a los certificados que todavía no tengan `templateId`.
                    </p>
                    <button
                      onClick={() => void runAction('apply_preferred_template', {})}
                      disabled={
                        runningAction !== null || report.summary.certificatesMissingTemplate === 0
                      }
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {runningAction === 'apply_preferred_template' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileBadge2 size={18} />
                      )}
                      Aplicar plantilla oficial a faltantes
                    </button>
                  </>
                ) : (
                  <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                    No existe una plantilla oficial activa disponible. Debes activar primero
                    `Certificado modelo curso taller`.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-sm font-black uppercase tracking-wide text-gray-500">Firmante principal</p>
                <p className="mt-3 text-sm text-gray-600">
                  Asigna un firmante institucional a todos los certificados que todavía no tengan `signer1Id`.
                </p>
                <select
                  value={selectedSignerId}
                  onChange={(event) => setSelectedSignerId(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary"
                >
                  <option value="">Selecciona un firmante activo</option>
                  {report.activeSigners.map((signer) => (
                    <option key={signer.id} value={signer.id}>
                      {signer.name} - {signer.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    void runAction('assign_primary_signer', { signerId: selectedSignerId })
                  }
                  disabled={
                    runningAction !== null ||
                    !selectedSignerId ||
                    report.summary.certificatesMissingPrimarySigner === 0
                  }
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAction === 'assign_primary_signer' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                  Asignar firmante a certificados incompletos
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-gray-500">Programa del certificado</p>
              <p className="mt-3 text-sm text-gray-600">
                Aplica solo a certificados cuyo `academicProgram` coincide exactamente con un programa activo del catálogo.
              </p>
              <button
                onClick={() => void runAction('apply_program_matches', {})}
                disabled={runningAction !== null || report.summary.certificatesMissingProgramId === 0}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAction === 'apply_program_matches' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench size={18} />
                )}
                Alinear programas por coincidencia exacta
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<UserRoundCheck size={20} />}
              title="Vinculación entre firmante y usuario interno"
              subtitle="Aquí se resuelve quién puede firmar operativamente por cada autoridad institucional."
            />

            {report.activeSigners.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={18} />}
                title="No hay firmantes activos"
                description="Primero debes registrar o activar al menos un firmante institucional."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Firmante</th>
                      <th className="px-4 py-3">Correos autorizados</th>
                      <th className="px-4 py-3">Usuarios internos resueltos</th>
                      <th className="px-4 py-3">Vincular</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.activeSigners.map((signer) => (
                      <tr key={signer.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{signer.name}</p>
                          <p className="text-xs text-gray-500">{signer.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          {signer.allowedEmails.length === 0 ? (
                            <p className="text-amber-700">Sin correos autorizados</p>
                          ) : (
                            <div className="space-y-1">
                              {signer.allowedEmails.map((email) => (
                                <p key={email} className="text-gray-700">
                                  - {email}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {signer.authorizedInternalUsers.length === 0 ? (
                            <p className="text-amber-700">Sin usuario interno vinculado</p>
                          ) : (
                            <div className="space-y-1">
                              {signer.authorizedInternalUsers.map((user) => (
                                <p key={user.uid} className="text-gray-700">
                                  - {user.displayName} ({user.email})
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-3 md:flex-row">
                            <select
                              value={signerEmailSelections[signer.id] || ''}
                              onChange={(event) =>
                                setSignerEmailSelections((current) => ({
                                  ...current,
                                  [signer.id]: event.target.value,
                                }))
                              }
                              className="min-w-[280px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary"
                            >
                              <option value="">Selecciona un usuario interno</option>
                              {report.signingInternalUsers.map((user) => (
                                <option key={user.uid} value={user.email}>
                                  {user.displayName} - {user.email} ({user.roleCode})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                void runAction('authorize_signer_email', {
                                  signerId: signer.id,
                                  email: signerEmailSelections[signer.id] || '',
                                })
                              }
                              disabled={
                                runningAction !== null || !(signerEmailSelections[signer.id] || '')
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {runningAction === 'authorize_signer_email' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserRoundCheck size={18} />
                              )}
                              Vincular correo
                            </button>
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
                icon={<FileBadge2 size={20} />}
                title="Certificados sin plantilla oficial"
                subtitle="Deben alinearse antes de pasar por firma y emisión."
              />

              {report.certificatesMissingTemplate.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay faltantes de plantilla"
                  description="Todos los certificados ya tienen plantilla asociada."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Programa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.certificatesMissingTemplate.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{item.folio}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-500">{item.studentId}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.status}</td>
                          <td className="px-4 py-3 text-gray-700">{item.academicProgram}</td>
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
                title="Certificados sin firmante principal"
                subtitle="No deberían avanzar a firma sin `signer1Id` institucional."
              />

              {report.certificatesMissingPrimarySigner.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay faltantes de firmante"
                  description="Todos los certificados ya tienen `signer1Id` asignado."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Programa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.certificatesMissingPrimarySigner.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{item.folio}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-500">{item.studentId}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.status}</td>
                          <td className="px-4 py-3 text-gray-700">{item.academicProgram}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<AlertTriangle size={20} />}
                title="Certificados sin `programId`"
                subtitle="Esto todavía requiere criterio de negocio; aquí solo se audita para no mapear programas a ciegas."
              />

              {report.certificatesMissingProgramId.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay huecos de programa en certificados"
                  description="Todos los certificados ya tienen `programId` resuelto."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Folio</th>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Programa legacy</th>
                        <th className="px-4 py-3">Coincidencia segura</th>
                        <th className="px-4 py-3 text-right">Abrir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.certificatesMissingProgramId.map((item) => (
                        <tr key={item.certificateId}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{item.folio}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-500">{item.studentId}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.academicProgram}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.matchedProgramName ? (
                              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                {item.matchedProgramName}
                              </span>
                            ) : (
                              <span className="text-amber-700">Sin match automático</span>
                            )}
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

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<AlertTriangle size={20} />}
                title="Participantes con ficha incompleta"
                subtitle="Estos datos deben sanearse después para cerrar bien el portal y la trazabilidad institucional."
              />

              {report.studentsMissingCatalogLinks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={18} />}
                  title="No hay huecos de catálogo en participantes"
                  description="Todos los participantes ya tienen programa, recinto, área y correo."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Correo</th>
                        <th className="px-4 py-3">Huecos</th>
                        <th className="px-4 py-3 text-right">Abrir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.studentsMissingCatalogLinks.map((item) => {
                        const gaps = [
                          !item.programId ? 'programa' : null,
                          !item.campusId ? 'recinto' : null,
                          !item.academicAreaId ? 'área' : null,
                          !item.email ? 'correo' : null,
                        ].filter(Boolean);

                        return (
                          <tr key={item.studentId}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{item.studentName}</p>
                              <p className="text-xs text-gray-500">{item.studentId}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.email || 'Sin correo'}</td>
                            <td className="px-4 py-3 text-amber-700">{gaps.join(', ')}</td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/dashboard/graduates/${encodeURIComponent(item.studentId)}`}
                                className="font-bold text-primary hover:underline"
                              >
                                Abrir participante
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
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
