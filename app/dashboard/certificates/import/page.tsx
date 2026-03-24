'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  LayoutTemplate,
  Loader2,
  MapPin,
  PenTool,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import {
  CertificateImportDetail,
  CertificateImportResult,
  importCertificatesFromExcel,
} from '@/app/actions/import-certificates';
import {
  buildCertificateImportPreviewRows,
  CertificateImportPreviewRow,
  detectMissingCertificateColumns,
} from '@/lib/application/utils/certificate-import';
import { toSerializableImportRows } from '@/lib/application/utils/serialize-import-rows';
import { getCertificateTemplateRepository, getListCampusesUseCase } from '@/lib/container';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProgramCombobox } from '@/components/ui/ProgramCombobox';
import { AcademicArea } from '@/lib/types/academicArea';
import { Campus } from '@/lib/types/campus';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { Signer } from '@/lib/types/signer';

type PreviewFilter = 'all' | CertificateImportPreviewRow['status'];
type ResultFilter = 'all' | CertificateImportDetail['type'];

function downloadTemplate() {
  const worksheet = XLSX.utils.json_to_sheet([
    {
      Matricula: '2024-0001',
      Nombre: 'Juan Perez',
      Cedula: '402-1234567-8',
      Email: 'juan@ejemplo.com',
      Folio: 'SIGCE-2026-CAP-0001',
      Curso: 'Software',
      Carrera: 'Ingenieria de Software',
      Tipo: 'CAP',
      Fecha: '2026-03-08',
      Calificacion: '95',
      Duracion: '40 horas',
      Descripcion: 'Participacion destacada',
    },
    {
      Matricula: '2024-0002',
      Nombre: 'Maria Garcia',
      Cedula: '001-9876543-2',
      Email: 'maria@ejemplo.com',
      Folio: '',
      Curso: 'Redes',
      Carrera: 'Telematica',
      Tipo: 'PROFUNDO',
      Fecha: '2026-03-08',
      Calificacion: '92',
      Duracion: '32 horas',
      Descripcion: 'Cohorte marzo',
    },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados');
  XLSX.writeFile(workbook, 'Plantilla_Importacion_Certificados_SIGCE.xlsx');
}

function getStatusClasses(status: 'ready_create' | 'warning' | 'error') {
  switch (status) {
    case 'ready_create':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'error':
    default:
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

function getDetailClasses(type: CertificateImportDetail['type']) {
  switch (type) {
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'info':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

function exportReport(result: CertificateImportResult) {
  const worksheet = XLSX.utils.json_to_sheet(
    result.details.map((detail) => ({
      Fila: detail.rowNumber,
      Matricula: detail.matricula,
      Folio: detail.folio,
      Tipo: detail.type,
      Accion: detail.action,
      Mensaje: detail.message,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado');
  XLSX.writeFile(workbook, 'Reporte_Importacion_Certificados_SIGCE.xlsx');
}

async function copyReport(result: CertificateImportResult) {
  const report = [
    'Reporte de importacion de certificados - SIGCE',
    `Total: ${result.total}`,
    `Certificados creados: ${result.certificatesCreated}`,
    `Participantes creados: ${result.studentsCreated}`,
    `Participantes actualizados: ${result.studentsUpdated}`,
    `Omitidos: ${result.skipped}`,
    `Avisos: ${result.warnings}`,
    `Errores: ${result.errors}`,
    '',
    ...result.details.map(
      (detail) =>
        `Fila ${detail.rowNumber} | ${detail.matricula} | ${detail.folio} | ${detail.type.toUpperCase()} | ${detail.message}`
    ),
  ].join('\n');

  await navigator.clipboard.writeText(report);
}

export default function ImportCertificatesPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateImportResult | null>(null);
  const [error, setError] = useState('');
  const [reportCopied, setReportCopied] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; code: string }[]>([]);
  const [areas, setAreas] = useState<AcademicArea[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);

  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedAcademicAreaId, setSelectedAcademicAreaId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedSigner1Id, setSelectedSigner1Id] = useState('');
  const [selectedSigner2Id, setSelectedSigner2Id] = useState('');
  const [selectedProgramName, setSelectedProgramName] = useState('');
  const [selectedExpirationDate, setSelectedExpirationDate] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [campusData, templateData, signersResponse, programsResponse] = await Promise.all([
          getListCampusesUseCase().execute(true),
          getCertificateTemplateRepository().list(true),
          fetch('/api/admin/signers?active=true'),
          fetch('/api/admin/academic-programs?active=true'),
        ]);

        setCampuses(campusData);
        setTemplates(templateData);

        const signersData = await signersResponse.json();
        if (signersData.success) {
          setSigners(signersData.data);
        }

        const programsData = await programsResponse.json();
        if (programsData.success) {
          setPrograms(programsData.data);
        }
      } catch (configError) {
        console.error('Error loading certificate import config:', configError);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const loadAcademicAreas = async () => {
      if (!selectedCampusId) {
        setAreas([]);
        setSelectedAcademicAreaId('');
        return;
      }

      try {
        const response = await fetch(
          `/api/admin/academic-areas?campusId=${selectedCampusId}&activeOnly=true`
        );
        const data = await response.json();

        if (data.success) {
          setAreas(data.data);
        } else {
          setAreas([]);
        }
      } catch (areaError) {
        console.error('Error loading academic areas for import:', areaError);
        setAreas([]);
      }
    };

    loadAcademicAreas();
  }, [selectedCampusId]);

  useEffect(() => {
    if (!reportCopied) return;
    const timeout = window.setTimeout(() => setReportCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [reportCopied]);

  const previewRows = buildCertificateImportPreviewRows(rawRows, {
    programOverride: selectedProgramName,
  });

  const missingColumns = detectMissingCertificateColumns(rawRows);
  const blockingErrors = missingColumns.length > 0;

  const totalRows = previewRows.length;
  const readyRows = previewRows.filter((row) => row.status === 'ready_create').length;
  const warningRows = previewRows.filter((row) => row.status === 'warning').length;
  const errorRows = previewRows.filter((row) => row.status === 'error').length;
  const filteredPreviewRows =
    previewFilter === 'all'
      ? previewRows
      : previewRows.filter((row) => row.status === previewFilter);
  const filteredResultDetails =
    !result || resultFilter === 'all'
      ? result?.details ?? []
      : result.details.filter((detail) => detail.type === resultFilter);
  const steps = [
    ['01', 'Configurar lote', selectedCampusId ? 'Listo' : 'En foco'],
    ['02', 'Subir archivo', file ? 'Listo' : selectedCampusId ? 'En foco' : 'Pendiente'],
    ['03', 'Revisar prevalidacion', previewRows.length ? 'Listo' : 'Pendiente'],
    ['04', 'Cerrar con reporte', result ? 'En foco' : 'Pendiente'],
  ] as const;

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
        const binary = loadEvent.target?.result;
        const workbook = XLSX.read(binary, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = toSerializableImportRows(
          XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: '',
          })
        );
        setRawRows(data);
      } catch (readError) {
        console.error('Error reading certificate import file:', readError);
        setError('Error al leer el archivo Excel. Asegurate de que el formato sea valido.');
        setFile(null);
        setRawRows([]);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!previewRows.length) return;

    if (!selectedCampusId) {
      setError('Debes seleccionar un recinto antes de importar.');
      return;
    }

    if (blockingErrors) {
      setError('Hay columnas obligatorias faltantes. Corrige el archivo antes de importar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const importResult = await importCertificatesFromExcel(toSerializableImportRows(rawRows), {
        campusId: selectedCampusId,
        academicAreaId: selectedAcademicAreaId || undefined,
        templateId: selectedTemplateId || undefined,
        signer1Id: selectedSigner1Id || undefined,
        signer2Id: selectedSigner2Id || undefined,
        programName: selectedProgramName || undefined,
        expirationDate: selectedExpirationDate || undefined,
        createdBy: user?.uid || 'bulk-import',
      });

      setResult(importResult);
      setResultFilter(importResult.errors > 0 ? 'error' : 'all');
    } catch (importError: any) {
      console.error('Error importing certificates:', importError);
      setError(importError?.message || 'Error durante la importacion masiva de certificados.');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setRawRows([]);
    setResult(null);
    setError('');
    setReportCopied(false);
    setPreviewFilter('all');
    setResultFilter('all');
    setSelectedAcademicAreaId('');
    setSelectedTemplateId('');
    setSelectedSigner1Id('');
    setSelectedSigner2Id('');
    setSelectedProgramName('');
    setSelectedExpirationDate('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-10">
      <div className="rounded-[32px] border border-primary/10 bg-[linear-gradient(135deg,rgba(14,53,124,0.06),rgba(255,255,255,0.98))] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <LayoutTemplate size={14} /> Fase 3
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-primary">
              Carga Masiva de Certificados
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              Configura el lote, valida inconsistencias antes de emitir certificados y
              cierra con un reporte exportable.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
            >
              <FileSpreadsheet size={18} /> Descargar Plantilla
            </button>
            <button
              onClick={resetImport}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {steps.map(([number, title, state]) => (
            <div key={number} className="rounded-[24px] border border-gray-100 bg-white/85 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Paso {number}
                  </div>
                  <h2 className="mt-2 text-base font-black text-slate-900">{title}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                    state === 'Listo'
                      ? 'bg-emerald-100 text-emerald-700'
                      : state === 'En foco'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {state}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
        <div>
          <h2 className="text-lg font-black text-gray-800">Paso 1 - Configuracion global del lote</h2>
          <p className="text-sm text-gray-400">
            Estos valores se aplicaran a todos los certificados que se generen en esta importacion.
          </p>
        </div>

        {loadingConfig ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando opciones...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Recinto <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCampusId}
                onChange={(event) => setSelectedCampusId(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Selecciona un recinto</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name} ({campus.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-red-400">Obligatorio para todos los certificados del lote.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={14} className="text-blue-500" /> Area academica
              </label>
              <select
                value={selectedAcademicAreaId}
                onChange={(event) => setSelectedAcademicAreaId(event.target.value)}
                disabled={!selectedCampusId}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCampusId ? 'Selecciona un area (opcional)' : 'Primero selecciona un recinto'}
                </option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <LayoutTemplate size={14} className="text-primary" /> Plantilla
              </label>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Predeterminada del sistema</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <PenTool size={14} className="text-primary" /> Firmante 1
              </label>
              <select
                value={selectedSigner1Id}
                onChange={(event) => setSelectedSigner1Id(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Sin firmante</option>
                {signers.map((signer) => (
                  <option key={signer.id} value={signer.id}>
                    {signer.name} ({signer.title})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <PenTool size={14} className="text-primary" /> Firmante 2
              </label>
              <select
                value={selectedSigner2Id}
                onChange={(event) => setSelectedSigner2Id(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Sin firmante</option>
                {signers.map((signer) => (
                  <option key={signer.id} value={signer.id}>
                    {signer.name} ({signer.title})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <LayoutTemplate size={14} className="text-amber-500" /> Fecha de expiracion global
              </label>
              <input
                type="date"
                value={selectedExpirationDate}
                onChange={(event) => setSelectedExpirationDate(event.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              />
              <p className="text-xs text-gray-400">Si se completa, se aplicara a todo el lote.</p>
            </div>

            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <LayoutTemplate size={14} className="text-primary" /> Programa global
              </label>
              {programs.length > 0 ? (
                <ProgramCombobox
                  programs={programs}
                  value={selectedProgramName}
                  onChange={setSelectedProgramName}
                  placeholder="Buscar programa o dejar en blanco para usar la columna Curso"
                />
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  Sin programas en catalogo. Se usara la columna &quot;Curso&quot; del Excel.
                </p>
              )}
              <p className="text-xs text-gray-400">
                Si se elige, sobreescribe el programa informado en cada fila del archivo.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h2 className="text-lg font-black text-gray-800">Paso 2 - Subir archivo Excel</h2>
          <p className="text-sm text-gray-400">
            Puedes traer folios predefinidos o dejar el campo vacio para que el sistema los genere.
          </p>
        </div>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className={`cursor-pointer flex flex-col items-center justify-center space-y-4 border-2 border-dashed rounded-2xl p-10 hover:bg-gray-50 transition-colors ${
            !selectedCampusId ? 'border-gray-200 opacity-50 pointer-events-none' : 'border-primary/30 hover:border-primary/60'
          }`}
        >
          <div className="bg-green-50 text-green-600 p-4 rounded-full">
            <FileSpreadsheet size={40} />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-bold text-gray-700">
              {selectedCampusId
                ? 'Haz clic para subir o arrastra tu archivo aqui'
                : 'Selecciona un recinto para habilitar la carga'}
            </p>
            <p className="text-sm text-gray-400">Soporta formatos .xlsx y .xls</p>
          </div>
        </label>

        {file && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 py-2 px-4 rounded-lg">
            <CheckCircle size={16} className="text-green-500" />
            {file.name} - {previewRows.length} registros encontrados
          </div>
        )}
      </div>

      {missingColumns.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Faltan columnas obligatorias.</p>
              <p className="mt-1">{missingColumns.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {previewRows.length > 0 && !result && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div>
              <h3 className="font-bold text-gray-800">Paso 3 - Prevalidacion del lote</h3>
              <p className="text-sm text-gray-500">
                Se aplican las reglas del flujo manual y se avisa si faltan datos o el folio se generara automaticamente.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 min-w-[320px]">
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-center">
                <div className="text-lg font-black text-slate-800">{totalRows}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Filas</div>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <div className="text-lg font-black text-emerald-700">{readyRows}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-600">Listas</div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
                <div className="text-lg font-black text-amber-700">{warningRows}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-amber-600">Revision</div>
              </div>
              <div className="rounded-xl bg-red-50 px-3 py-2 text-center">
                <div className="text-lg font-black text-red-700">{errorRows}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-red-600">Errores</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'ready_create', 'warning', 'error'] as PreviewFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPreviewFilter(filter)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                    previewFilter === filter
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {filter === 'all'
                    ? 'Todas'
                    : filter === 'ready_create'
                      ? 'Listas'
                      : filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Fila</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Matricula</th>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Folio</th>
                  <th className="px-6 py-3">Programa</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPreviewRows.slice(0, 12).map((row) => (
                  <tr key={`${row.rowNumber}-${row.matricula}-${row.folio}`} className="hover:bg-gray-50/50 align-top">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{row.rowNumber}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(row.status)}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{row.matricula || '-'}</td>
                    <td className="px-6 py-3 text-gray-700">{row.studentName || '-'}</td>
                    <td className="px-6 py-3 text-gray-500">{row.folio || 'AUTO'}</td>
                    <td className="px-6 py-3 text-gray-500">{row.academicProgram || '-'}</td>
                    <td className="px-6 py-3 text-gray-500">{row.issueDate || 'Actual'}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {[...row.errors, ...row.warnings].join(' ') || 'Sin observaciones.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50/30 space-y-4">
            <div className="rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm text-gray-600">
              <p className="font-bold text-gray-800">Checklist operativo</p>
              <ul className="mt-2 space-y-2">
                <li>{blockingErrors ? 'No' : 'Si'} hay columnas minimas requeridas.</li>
                <li>{warningRows} filas tienen observaciones que conviene revisar.</li>
                <li>{errorRows} filas fallaran si no corriges el archivo.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-gray-600 space-y-1">
              <p><span className="font-bold text-gray-800">Recinto:</span> {campuses.find((campus) => campus.id === selectedCampusId)?.name || '-'}</p>
              <p><span className="font-bold text-gray-800">Plantilla:</span> {selectedTemplateId ? (templates.find((template) => template.id === selectedTemplateId)?.name || '-') : 'Predeterminada del sistema'}</p>
              <p><span className="font-bold text-gray-800">Firmantes:</span> {[signers.find((signer) => signer.id === selectedSigner1Id)?.name, signers.find((signer) => signer.id === selectedSigner2Id)?.name].filter(Boolean).join(' / ') || 'Sin firmantes globales'}</p>
            </div>

            <button
              onClick={handleImport}
              disabled={loading || !selectedCampusId || blockingErrors}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
              {loading ? 'Procesando lote...' : 'Iniciar importacion masiva'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Cierre operativo del lote</h3>
                <p className="text-gray-500">Resumen final del lote de certificados.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportReport(result)}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/[0.04] px-4 py-3 text-sm font-bold text-primary hover:bg-primary/[0.08]"
              >
                <Download size={16} />
                Descargar reporte
              </button>
              <button
                onClick={async () => {
                  try {
                    await copyReport(result);
                    setReportCopied(true);
                  } catch {
                    setError('No se pudo copiar el reporte.');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <ClipboardCheck size={16} />
                {reportCopied ? 'Reporte copiado' : 'Copiar resumen'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-6">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-3xl font-black text-gray-800">{result.total}</div>
              <div className="text-sm font-medium text-gray-500">Total leidos</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl text-center text-emerald-700">
              <div className="text-3xl font-black">{result.certificatesCreated}</div>
              <div className="text-sm font-medium">Certificados</div>
            </div>
            <div className="p-4 bg-sky-50 rounded-xl text-center text-sky-700">
              <div className="text-3xl font-black">{result.studentsCreated}</div>
              <div className="text-sm font-medium">Participantes creados</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center text-blue-700">
              <div className="text-3xl font-black">{result.studentsUpdated}</div>
              <div className="text-sm font-medium">Participantes actualizados</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center text-amber-700">
              <div className="text-3xl font-black">{result.skipped}</div>
              <div className="text-sm font-medium">Omitidos</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center text-red-700">
              <div className="text-3xl font-black">{result.errors}</div>
              <div className="text-sm font-medium">Errores</div>
            </div>
          </div>

          {result.details.length > 0 && (
            <div className="overflow-hidden rounded-[24px] border border-gray-100">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 className="font-bold text-gray-700">Detalle del proceso</h4>
                  <p className="text-sm text-gray-500">Filtra el reporte por severidad.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'success', 'warning', 'info', 'error'] as ResultFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setResultFilter(filter)}
                      className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                        resultFilter === filter
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter === 'all' ? 'Todo' : filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {filteredResultDetails.map((detail, index) => (
                  <div key={`${detail.rowNumber}-${index}`} className="px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getDetailClasses(detail.type)}`}>
                        {detail.type}
                      </span>
                      <span className="font-mono text-xs text-gray-500">Fila {detail.rowNumber}</span>
                      <span className="font-semibold text-gray-900">{detail.matricula}</span>
                      <span className="text-xs text-gray-500">{detail.folio}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{detail.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetImport}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
          >
            Nueva Importacion
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 font-medium flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
    </div>
  );
}
