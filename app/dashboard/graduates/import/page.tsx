'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';

import {
  buildStudentImportPreviewRows,
  detectMissingParticipantColumns,
  StudentImportPreviewRow,
} from '@/lib/application/utils/student-import';
import { toSerializableImportRows } from '@/lib/application/utils/serialize-import-rows';
import {
  importStudentsFromExcel,
  StudentImportDetail,
  StudentImportResult,
} from '@/app/actions/import-students';

const REQUIRED_COLUMNS = ['Matricula', 'Nombres', 'Apellidos'];
const OPTIONAL_COLUMNS = ['Cedula', 'Email', 'Telefono', 'Carrera'];

type PreviewFilter = 'all' | StudentImportPreviewRow['status'];
type ResultFilter = 'all' | StudentImportDetail['type'];

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      Matricula: '2024-0001',
      Nombres: 'Juan Andres',
      Apellidos: 'Perez Rodriguez',
      Cedula: '402-1234567-8',
      Email: 'juan@ejemplo.com',
      Telefono: '809-555-1122',
      Carrera: 'Ingenieria de Software',
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
  XLSX.writeFile(wb, 'Plantilla_Importacion_Participantes_SIGCE.xlsx');
}

function badge(status: StudentImportPreviewRow['status']) {
  if (status === 'ready_create') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'ready_update') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'ready_skip') return 'border-slate-200 bg-slate-100 text-slate-700';
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function detailBadge(type: StudentImportDetail['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (type === 'info') return 'border-slate-200 bg-slate-100 text-slate-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function exportReport(result: StudentImportResult) {
  const ws = XLSX.utils.json_to_sheet(
    result.details.map((detail) => ({
      Fila: detail.rowNumber,
      Matricula: detail.matricula,
      Tipo: detail.type,
      Accion: detail.action,
      Mensaje: detail.message,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resultado');
  XLSX.writeFile(wb, 'Reporte_Importacion_Participantes_SIGCE.xlsx');
}

async function copyReport(result: StudentImportResult) {
  const text = [
    'Reporte de importacion de participantes - SIGCE',
    `Total: ${result.total}`,
    `Creados: ${result.created}`,
    `Actualizados: ${result.updated}`,
    `Omitidos: ${result.skipped}`,
    `Avisos: ${result.warnings}`,
    `Errores: ${result.errors}`,
    '',
    ...result.details.map(
      (detail) =>
        `Fila ${detail.rowNumber} | ${detail.matricula} | ${detail.type.toUpperCase()} | ${detail.message}`
    ),
  ].join('\n');

  await navigator.clipboard.writeText(text);
}

export default function ImportGraduatesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<StudentImportPreviewRow[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [result, setResult] = useState<StudentImportResult | null>(null);
  const [error, setError] = useState('');
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [copied, setCopied] = useState(false);

  const summary = {
    total: previewRows.length,
    create: previewRows.filter((row) => row.status === 'ready_create').length,
    update: previewRows.filter((row) => row.status === 'ready_update').length,
    skip: previewRows.filter((row) => row.status === 'ready_skip').length,
    warning: previewRows.filter((row) => row.status === 'warning').length,
    error: previewRows.filter((row) => row.status === 'error').length,
  };

  const filteredPreview =
    previewFilter === 'all'
      ? previewRows
      : previewRows.filter((row) => row.status === previewFilter);

  const filteredDetails =
    !result || resultFilter === 'all'
      ? result?.details ?? []
      : result.details.filter((detail) => detail.type === resultFilter);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);
    setPreviewFilter('all');
    setResultFilter('all');

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = toSerializableImportRows(
          XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })
        );
        setMissingColumns(detectMissingParticipantColumns(data));
        setPreviewRows(buildStudentImportPreviewRows(data));
      } catch (readError) {
        console.error('Error reading student import file:', readError);
        setError('No se pudo leer el archivo Excel. Verifica que el formato sea valido.');
        setFile(null);
        setPreviewRows([]);
        setMissingColumns([]);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!previewRows.length || missingColumns.length > 0) return;
    setLoading(true);
    setError('');
    try {
      const importResult = await importStudentsFromExcel(
        toSerializableImportRows(previewRows.map((row) => row.source))
      );
      setResult(importResult);
      setResultFilter(importResult.errors > 0 ? 'error' : 'all');
    } catch (importError: any) {
      console.error('Error importing students:', importError);
      setError(importError?.message || 'Error durante la importacion de participantes.');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewRows([]);
    setMissingColumns([]);
    setResult(null);
    setError('');
    setPreviewFilter('all');
    setResultFilter('all');
  };

  const steps = [
    ['01', 'Preparar archivo', file ? 'Listo' : 'En foco'],
    ['02', 'Revisar prevalidacion', previewRows.length ? 'Listo' : 'Pendiente'],
    ['03', 'Procesar lote', result ? 'Listo' : previewRows.length ? 'En foco' : 'Pendiente'],
    ['04', 'Cerrar con reporte', result ? 'En foco' : 'Pendiente'],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-10">
      <div className="rounded-[32px] border border-primary/10 bg-[linear-gradient(135deg,rgba(14,53,124,0.06),rgba(255,255,255,0.98))] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => router.back()} className="mt-1 rounded-full p-2 hover:bg-white/80">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Users size={14} /> Fase 3
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-primary">Importacion de Participantes</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                Asistente operativo con pasos visibles, prevalidacion por fila y reporte exportable al cierre.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadTemplate} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
              Descargar plantilla
            </button>
            <button onClick={resetImport} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {steps.map(([number, title, state]) => (
            <div key={number} className="rounded-[24px] border border-gray-100 bg-white/85 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Paso {number}</div>
                  <h2 className="mt-2 text-base font-black text-slate-900">{title}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${state === 'Listo' ? 'bg-emerald-100 text-emerald-700' : state === 'En foco' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Upload size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Paso 1. Carga del archivo</h2>
                <p className="text-sm text-gray-500">Se valida la estructura antes de ejecutar cambios reales.</p>
              </div>
            </div>
            <div className="mt-6 rounded-[24px] border-2 border-dashed border-primary/20 bg-slate-50/80 p-6">
              <input id="student-import-upload" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <label htmlFor="student-import-upload" className="flex cursor-pointer flex-col items-center gap-4 rounded-[20px] border border-white/80 bg-white px-6 py-10 text-center shadow-sm hover:bg-slate-50">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><FileSpreadsheet size={30} /></div>
                <div>
                  <p className="text-base font-bold text-gray-800">Haz clic para cargar el Excel de participantes</p>
                  <p className="text-sm text-gray-500">Formatos permitidos: .xlsx y .xls</p>
                </div>
              </label>
              {file && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Archivo cargado: {file.name} ({previewRows.length} filas)</div>}
            </div>
            {missingColumns.length > 0 && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Faltan columnas obligatorias.</p><p className="mt-1">{missingColumns.join(', ')}</p></div></div></div>}
          </div>

          {previewRows.length > 0 && !result && (
            <div className="rounded-[28px] border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Paso 2. Prevalidacion del lote</h2>
                <p className="text-sm text-gray-500">Revisa antes de importar que filas crean, actualizan, se omiten o fallan.</p>
              </div>
              <div className="grid gap-4 border-b border-gray-100 px-6 py-5 md:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Filas</div><div className="mt-2 text-3xl font-black text-slate-900">{summary.total}</div></div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">Crear</div><div className="mt-2 text-3xl font-black text-emerald-700">{summary.create}</div></div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">Actualizar</div><div className="mt-2 text-3xl font-black text-sky-700">{summary.update}</div></div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">Revision</div><div className="mt-2 text-3xl font-black text-amber-700">{summary.warning}</div></div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">Errores</div><div className="mt-2 text-3xl font-black text-red-700">{summary.error}</div></div>
              </div>
              <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'ready_create', 'ready_update', 'ready_skip', 'warning', 'error'] as PreviewFilter[]).map((filter) => (
                      <button key={filter} onClick={() => setPreviewFilter(filter)} className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${previewFilter === filter ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{filter === 'all' ? 'Todas' : filter.replace('ready_', '')}</button>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-[24px] border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-gray-500"><tr><th className="px-5 py-3">Fila</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Matricula</th><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Cedula</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Detalle</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {filteredPreview.slice(0, 12).map((row) => (
                            <tr key={`${row.rowNumber}-${row.matricula}`} className="align-top">
                              <td className="px-5 py-4 font-mono text-xs text-gray-500">{row.rowNumber}</td>
                              <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badge(row.status)}`}>{row.statusLabel}</span></td>
                              <td className="px-5 py-4 font-semibold text-gray-900">{row.matricula || '-'}</td>
                              <td className="px-5 py-4 text-gray-700">{row.fullName || '-'}</td>
                              <td className="px-5 py-4 text-gray-500">{row.cedula || '-'}</td>
                              <td className="px-5 py-4 text-gray-500">{row.email || '-'}</td>
                              <td className="px-5 py-4 text-xs leading-6 text-gray-500">{[...row.errors, ...row.warnings].join(' ') || 'Sin observaciones.'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-primary/10 bg-primary/[0.03] p-5">
                    <h3 className="font-black text-gray-900">Checklist operativo</h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                      <li>{missingColumns.length === 0 ? 'Si' : 'No'} hay columnas minimas requeridas.</li>
                      <li>{summary.warning} filas requieren revision manual.</li>
                      <li>{summary.error} filas fallaran si las dejas en el lote.</li>
                      <li>{summary.skip} filas no aportan cambios nuevos.</li>
                    </ul>
                  </div>
                  <button onClick={handleImport} disabled={loading || missingColumns.length > 0} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus size={18} />}
                    {loading ? 'Procesando lote...' : 'Paso 3. Iniciar importacion'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><ShieldCheck size={20} /></div>
              <div><h2 className="font-black text-gray-900">Formato oficial</h2><p className="text-sm text-gray-500">Columnas esperadas para esta fase.</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Requeridas</p><div className="flex flex-wrap gap-2">{REQUIRED_COLUMNS.map((column) => <span key={column} className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{column}</span>)}</div></div>
              <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Opcionales</p><div className="flex flex-wrap gap-2">{OPTIONAL_COLUMNS.map((column) => <span key={column} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">{column}</span>)}</div></div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700"><p className="font-bold">Compatibilidad temporal</p><p className="mt-1">Se admite la columna legacy <span className="font-mono">Nombre</span>, pero la prevalidacion la marcara para revision.</p></div>
            </div>
          </div>
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-black text-gray-900">Que debes esperar</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>Las filas validas crean o actualizan participantes.</li>
              <li>Las filas sin cambios se omiten con detalle explicito.</li>
              <li>Los errores quedan visibles antes y despues del lote.</li>
              <li>Este flujo no genera certificados.</li>
            </ul>
          </div>
        </aside>
      </div>

      {result && (
        <section className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={28} /></div>
              <div><h2 className="text-xl font-black text-gray-900">Paso 4. Importacion completada</h2><p className="text-sm text-gray-500">Resultado final del procesamiento, listo para auditoria.</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => exportReport(result)} className="inline-flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/[0.04] px-4 py-3 text-sm font-bold text-primary hover:bg-primary/[0.08]"><Download size={16} /> Descargar reporte</button>
              <button onClick={async () => { try { await copyReport(result); setCopied(true); } catch { setError('No se pudo copiar el reporte.'); } }} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"><ClipboardCheck size={16} /> {copied ? 'Reporte copiado' : 'Copiar resumen'}</button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-6">
            <div className="rounded-2xl bg-slate-50 p-4 text-center"><div className="text-3xl font-black text-slate-900">{result.total}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Total</div></div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-center"><div className="text-3xl font-black text-emerald-700">{result.created}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Creados</div></div>
            <div className="rounded-2xl bg-sky-50 p-4 text-center"><div className="text-3xl font-black text-sky-700">{result.updated}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Actualizados</div></div>
            <div className="rounded-2xl bg-slate-100 p-4 text-center"><div className="text-3xl font-black text-slate-700">{result.skipped}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Omitidos</div></div>
            <div className="rounded-2xl bg-amber-50 p-4 text-center"><div className="text-3xl font-black text-amber-700">{result.warnings}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Avisos</div></div>
            <div className="rounded-2xl bg-red-50 p-4 text-center"><div className="text-3xl font-black text-red-700">{result.errors}</div><div className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Errores</div></div>
          </div>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-gray-100">
            <div className="flex flex-col gap-4 border-b border-gray-100 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h3 className="font-black text-gray-900">Detalle del proceso</h3><p className="text-sm text-gray-500">Filtra el reporte por severidad.</p></div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'success', 'warning', 'info', 'error'] as ResultFilter[]).map((filter) => (
                  <button key={filter} onClick={() => setResultFilter(filter)} className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${resultFilter === filter ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{filter === 'all' ? 'Todo' : filter}</button>
                ))}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {filteredDetails.map((detail, index) => (
                <div key={`${detail.rowNumber}-${index}`} className="px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${detailBadge(detail.type)}`}>{detail.type}</span>
                    <span className="font-mono text-xs text-gray-500">Fila {detail.rowNumber}</span>
                    <span className="font-semibold text-gray-900">{detail.matricula}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{detail.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div></div>}
    </div>
  );
}
