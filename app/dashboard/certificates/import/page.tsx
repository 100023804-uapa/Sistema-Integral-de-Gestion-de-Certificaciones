'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, MapPin, LayoutTemplate } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importCertificatesFromExcel, ImportResult } from '@/app/actions/import-certificates';
import { getListCampusesUseCase, getCertificateTemplateRepository } from '@/lib/container';
import { Campus } from '@/lib/container';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { BookOpen } from 'lucide-react';

export default function ImportCertificatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  // Configuración global de la importación
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [programs, setPrograms] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedProgramName, setSelectedProgramName] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [campusData, templateData] = await Promise.all([
          getListCampusesUseCase().execute(true),
          getCertificateTemplateRepository().list(true),
        ]);
        setCampuses(campusData);
        setTemplates(templateData);

        const progRes = await fetch('/api/admin/academic-programs?active=true');
        const progData = await progRes.json();
        if (progData.success) setPrograms(progData.data);
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data);
      } catch (err) {
        setError('Error al leer el archivo Excel. Asegúrate de que sea válido.');
        setFile(null);
        setPreviewData([]);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!previewData.length) return;
    if (!selectedCampusId) {
      setError('Debes seleccionar un Recinto antes de importar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanData = JSON.parse(JSON.stringify(previewData)).map((row: any) => ({
        ...row,
        // Sobreescribir Curso con el programa seleccionado del catálogo (si se eligió)
        ...(selectedProgramName ? { Curso: selectedProgramName } : {}),
      }));
      const importRes = await importCertificatesFromExcel(cleanData, selectedCampusId, selectedTemplateId || undefined);
      setResult(importRes);
    } catch (err: any) {
      setError('Error durante la importación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-primary tracking-tighter">Carga Masiva de Certificados</h1>
           <p className="text-gray-500">Sube un archivo Excel (.xlsx) para registrar participantes y generar sus certificados en lote.</p>
        </div>
        
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
            className="px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-colors flex items-center gap-2 shrink-0"
        >
            <FileSpreadsheet size={18} /> Descargar Plantilla
        </button>
      </div>

      {/* PASO 1 — Configuración Global */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
        <div>
          <h2 className="text-lg font-black text-gray-800">Paso 1 — Configuración de la Importación</h2>
          <p className="text-sm text-gray-400">Estos valores se aplicarán a todos los registros importados.</p>
        </div>

        {loadingConfig ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando opciones...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Recinto — Obligatorio */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Recinto <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Selecciona un recinto</option>
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <p className="text-xs text-red-400">Obligatorio. Se asignará a todos los registros.</p>
            </div>

            {/* Programa Académico — Opcional */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <BookOpen size={14} className="text-primary" /> Programa <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              {programs.length > 0 ? (
                <select
                  value={selectedProgramName}
                  onChange={(e) => setSelectedProgramName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                >
                  <option value="">Usar columna &quot;Curso&quot; del Excel</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.code})</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  Sin programas en catálogo. Se usará la columna &quot;Curso&quot; del Excel.
                </p>
              )}
              <p className="text-xs text-gray-400">Si se elige, sobreescribe la columna &quot;Curso&quot; del Excel.</p>
            </div>

            {/* Plantilla — Opcional */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <LayoutTemplate size={14} className="text-primary" /> Plantilla <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
              >
                <option value="">Predeterminada del sistema</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Se aplicará a todos los certificados de esta importación.</p>
            </div>
          </div>
        )}
      </div>

      {/* PASO 2 — Upload */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h2 className="text-lg font-black text-gray-800">Paso 2 — Subir Archivo Excel</h2>
          <p className="text-sm text-gray-400">Usa la plantilla descargable para asegurarte de que las columnas estén correctas.</p>
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
                  {selectedCampusId ? 'Haz clic para subir o arrastra tu archivo aquí' : 'Selecciona un Recinto para habilitar la carga'}
                </p>
                <p className="text-sm text-gray-400">Soporta formatos .xlsx y .xls</p>
            </div>
        </label>
        
        {file && (
             <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 py-2 px-4 rounded-lg">
                <CheckCircle size={16} className="text-green-500" />
                {file.name} — {previewData.length} registros encontrados
             </div>
        )}
      </div>

       {/* Preview Table */}
       {previewData.length > 0 && !result && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Paso 3 — Previsualización (Primeros 5 registros)</h3>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-500">Total: {previewData.length}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Matrícula</th>
                            <th className="px-6 py-3">Cédula</th>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Folio</th>
                            <th className="px-6 py-3">Curso</th>
                            <th className="px-6 py-3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {previewData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-6 py-3 font-medium text-gray-900">{row.Matricula}</td>
                                <td className="px-6 py-3 text-gray-500">{row.Cedula || '-'}</td>
                                <td className="px-6 py-3">{row.Nombre}</td>
                                <td className="px-6 py-3 text-gray-500">{row.Folio || 'Auto'}</td>
                                <td className="px-6 py-3 text-gray-500">{row.Curso}</td>
                                <td className="px-6 py-3 text-gray-500">{String(row.Fecha)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-6 bg-gray-50/30">
                {/* Resumen de configuración seleccionada */}
                <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-gray-600 space-y-1">
                  <p><span className="font-bold text-gray-800">Recinto:</span> {campuses.find(c => c.id === selectedCampusId)?.name || '-'}</p>
                  <p><span className="font-bold text-gray-800">Plantilla:</span> {selectedTemplateId ? (templates.find(t => t.id === selectedTemplateId)?.name || '-') : 'Predeterminada del sistema'}</p>
                </div>
                <button 
                    onClick={handleImport} 
                    disabled={loading || !selectedCampusId}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                    {loading ? 'Procesando...' : 'Iniciar Importación Masiva'}
                </button>
            </div>
        </div>
       )}

       {/* Results */}
       {result && (
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 p-3 rounded-full">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Importación Completada</h3>
                        <p className="text-gray-500">Resumen del proceso de carga masiva.</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-3xl font-black text-gray-800">{result.total}</div>
                        <div className="text-sm font-medium text-gray-500">Total Leídos</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-center text-green-700">
                        <div className="text-3xl font-black">{result.success}</div>
                        <div className="text-sm font-medium">Importados</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl text-center text-blue-700">
                        <div className="text-3xl font-black">{result.skipped}</div>
                        <div className="text-sm font-medium">Omitidos (Duplicados)</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl text-center text-red-700">
                        <div className="text-3xl font-black">{result.errors}</div>
                        <div className="text-sm font-medium">Errores</div>
                    </div>
                </div>

                {result.details.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl max-h-60 overflow-y-auto">
                        <h4 className="font-bold text-gray-700 mb-2 text-sm opacity-70 uppercase tracking-wider">Detalles del Proceso</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {result.details.map((msg, i) => (
                                <li key={i} className={`flex gap-2 p-2 rounded-lg ${
                                    msg.type === 'error' ? 'bg-red-50 text-red-700' : 
                                    msg.type === 'info' ? 'bg-blue-50 text-blue-700' : 
                                    'bg-green-50 text-green-700'
                                }`}>
                                    <span className="flex-shrink-0 mt-0.5">
                                        {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                                    </span>
                                    {msg.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <button 
                    onClick={() => { setFile(null); setPreviewData([]); setResult(null); setSelectedCampusId(''); setSelectedTemplateId(''); }}
                    className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                    Nueva Importación
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
