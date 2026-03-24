"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Trash2, Sprout, RefreshCw, CheckCircle2,
  AlertTriangle, Database, ShieldAlert, ChevronRight,
  Loader2, BookOpen, MapPin, FileText, Users, Award, Shield, Settings
} from 'lucide-react';

// ── Guardián: solo renderiza en desarrollo ───────────────────────────────
const isDev = process.env.NODE_ENV === 'development';

interface CollectionCounts {
  [key: string]: number;
}

type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

interface ActionResult {
  status: ActionStatus;
  message: string;
  details?: Record<string, any>;
}

// Iconos y metadatos por colección
const colIcons: Record<string, { icon: any, label: string, isCatalog: boolean, dangerLevel: 'high'|'medium'|'low' }> = {
  // Core
  certificates:      { icon: Award,     label: 'Certificados',          isCatalog: false, dangerLevel: 'high' },
  certificateStates: { icon: RefreshCw, label: 'Estados de Cert.',      isCatalog: false, dangerLevel: 'high' },
  stateHistories:    { icon: RefreshCw, label: 'Historial Estados',     isCatalog: false, dangerLevel: 'medium' },
  
  // Firmas
  digitalSignatures: { icon: FileText,  label: 'Firmas Digitales',      isCatalog: false, dangerLevel: 'high' },
  signatureRequests: { icon: ShieldAlert,label: 'Solicitudes Firma',    isCatalog: false, dangerLevel: 'medium' },
  signatureTemplates:{ icon: FileText,  label: 'Plantillas de Firma',   isCatalog: true,  dangerLevel: 'low' },
  
  // Personas
  students:          { icon: Users,     label: 'Estudiantes',           isCatalog: false, dangerLevel: 'medium' },
  
  // Plantillas
  templates:             { icon: FileText,  label: 'Planti. (Legacy)',      isCatalog: true,  dangerLevel: 'low' },
  certificateTemplates:  { icon: FileText,  label: 'Planti. Certificado',   isCatalog: true,  dangerLevel: 'low' },
  generatedCertificates: { icon: Award,     label: 'Certificados Gen.',     isCatalog: false, dangerLevel: 'high' },

  // Catálogo 
  campuses:          { icon: MapPin,    label: 'Recintos',              isCatalog: true,  dangerLevel: 'low' },
  academicAreas:     { icon: Database,  label: 'Áreas Académicas',      isCatalog: true,  dangerLevel: 'low' },
  academicPrograms:  { icon: BookOpen,  label: 'Programas',             isCatalog: true,  dangerLevel: 'low' },
  certificateTypes:  { icon: FileText,  label: 'Tipos de Certificado',  isCatalog: true,  dangerLevel: 'low' },
  
  // Sistema / Admin
  roles:             { icon: Shield,    label: 'Roles y Permisos',      isCatalog: true,  dangerLevel: 'high' },
  userRoles:         { icon: Shield,    label: 'Asig. de Roles',        isCatalog: false, dangerLevel: 'high' },
  system_config:     { icon: Settings,  label: 'Configuración Sistema', isCatalog: true,  dangerLevel: 'high' },
  access_requests:   { icon: ShieldAlert,label: 'Solicitudes Acceso',   isCatalog: false, dangerLevel: 'medium' },
  access_users:      { icon: Shield,    label: 'Usuarios Admin',        isCatalog: false, dangerLevel: 'high' },
};

export default function DevToolsPage() {
  const [counts, setCounts] = useState<CollectionCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [clearResult, setClearResult] = useState<ActionResult>({ status: 'idle', message: '' });
  const [seedResult, setSeedResult] = useState<ActionResult>({ status: 'idle', message: '' });
  const [confirmClear, setConfirmClear] = useState(false);
  
  // Estado para las colecciones seleccionadas para borrar
  const [selectedToClear, setSelectedToClear] = useState<Set<string>>(
    new Set(['certificates', 'certificateStates', 'digitalSignatures']) // Por defecto las de prueba
  );

  // Estado para las colecciones seleccionadas para sembrar
  const [selectedToSeed, setSelectedToSeed] = useState<Set<string>>(
    new Set(['certificates', 'students']) // Por defecto las de prueba
  );

  // ── Cargar conteos ─────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const res = await fetch('/api/admin/dev-tools');
      const data = await res.json();
      if (data.success) setCounts(data.counts);
    } catch {
      setCounts(null);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // ── Manejar selección de checkboxes ────────────────────────────────────
  const toggleSelection = (col: string) => {
    const newSelection = new Set(selectedToClear);
    if (newSelection.has(col)) {
      newSelection.delete(col);
    } else {
      newSelection.add(col);
    }
    setSelectedToClear(newSelection);
    setConfirmClear(false); // Resetear confirmación si cambian la selección
  };

  const selectAll = () => {
    if (counts) {
      setSelectedToClear(new Set(Object.keys(counts)));
    }
  };

  const selectNone = () => {
    setSelectedToClear(new Set());
  };

  // ── Manejar selección de checkboxes (Siembra) ──────────────────────────
  const toggleSeedSelection = (col: string) => {
    const newSelection = new Set(selectedToSeed);
    if (newSelection.has(col)) {
      newSelection.delete(col);
    } else {
      newSelection.add(col);
    }
    setSelectedToSeed(newSelection);
  };

  const selectAllSeed = () => {
    if (counts) {
      setSelectedToSeed(new Set(Object.keys(counts)));
    }
  };

  const selectNoneSeed = () => {
    setSelectedToSeed(new Set());
  };

  // ── Acción: Limpiar ────────────────────────────────────────────────────
  const handleClear = async () => {
    if (selectedToClear.size === 0) return;
    
    setClearResult({ status: 'loading', message: 'Eliminando datos seleccionados...' });
    setConfirmClear(false);
    try {
      const res = await fetch('/api/admin/dev-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'clear',
          collectionsToClear: Array.from(selectedToClear)
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClearResult({ status: 'success', message: data.message, details: data.details });
        await fetchCounts(); // Recargar conteos tras borrar
      } else {
        setClearResult({ status: 'error', message: data.error || 'Error desconocido' });
      }
    } catch (e: any) {
      setClearResult({ status: 'error', message: e.message });
    }
  };

  // ── Acción: Sembrar ────────────────────────────────────────────────────
  const handleSeed = async () => {
    if (selectedToSeed.size === 0) return;

    setSeedResult({ status: 'loading', message: 'Creando datos de ejemplo...' });
    try {
      const res = await fetch('/api/admin/dev-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'seed',
          collectionsToSeed: Array.from(selectedToSeed)
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeedResult({ status: 'success', message: data.message, details: data.details });
        await fetchCounts();
      } else {
        setSeedResult({ status: 'error', message: data.error || 'Error desconocido' });
      }
    } catch (e: any) {
      setSeedResult({ status: 'error', message: e.message });
    }
  };

  // Render helpers
  const getDangerColor = (level: string) => {
    if (level === 'high') return 'text-red-500';
    if (level === 'medium') return 'text-amber-500';
    return 'text-blue-500';
  };

  // ── Guardia de entorno ─────────────────────────────────────────────────
  if (!isDev) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <ShieldAlert size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-700">Acceso Restringido</h2>
          <p className="text-gray-500 text-sm">Esta herramienta solo está disponible en entorno de desarrollo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 rounded-xl">
          <Wrench size={26} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Dev Tools Avanzado</h1>
          <p className="text-sm text-amber-600 font-medium flex items-center gap-1">
            <AlertTriangle size={13} /> Panel de control de datos maestos (Solo Dev)
          </p>
        </div>
      </div>

      {/* ── Estado actual de colecciones ─────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Database size={16} /> Estado de la Base de Datos (Firestore)
          </h2>
          <button
            onClick={fetchCounts}
            disabled={loadingCounts}
            className="text-xs font-bold text-gray-500 hover:text-primary flex items-center gap-1 transition-colors px-3 py-1.5 bg-white border rounded-lg shadow-sm"
          >
            <RefreshCw size={12} className={loadingCounts ? 'animate-spin' : ''} />
            Actualizar Conteos
          </button>
        </div>

        {loadingCounts ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={32} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-gray-50">
            {counts && Object.entries(counts).map(([key, count]) => {
              const meta = colIcons[key] || { icon: Database, label: key, isCatalog: false, dangerLevel: 'low' };
              const Icon = meta.icon;
              const hasData = count > 0;
              return (
                <div key={key} className={`p-5 flex flex-col items-center text-center gap-2 transition-colors ${hasData ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className={`p-2 rounded-full ${hasData ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    <Icon size={20} className={hasData ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <span className={`text-3xl font-black ${hasData ? 'text-gray-800' : 'text-gray-300'}`}>
                    {count}
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-600 leading-tight">{meta.label}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{key}</span>
                  </div>
                  {meta.isCatalog && (
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-500 rounded px-1.5 py-0.5">Catálogo</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LIMPIAR */}
        <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-red-700">Limpieza Selectiva</h2>
                <p className="text-xs text-red-400">Selecciona qué colecciones vaciar completamente</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
               <button onClick={selectAll} className="text-red-600 font-bold hover:underline">Todos</button>
               <span className="text-red-300">|</span>
               <button onClick={selectNone} className="text-gray-500 font-bold hover:underline">Ninguno</button>
            </div>
          </div>

          <div className="p-0 flex-1 flex flex-col">
             {/* Lista de Checkboxes (scrollable si hay muchos) */}
             <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
               {counts && Object.entries(counts).map(([key, count]) => {
                  const meta = colIcons[key] || { icon: Database, label: key, isCatalog: false, dangerLevel: 'low' };
                  const Icon = meta.icon;
                  const isSelected = selectedToClear.has(key);
                  
                  return (
                    <label 
                      key={key} 
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50/30' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelection(key)}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                           <Icon size={16} className={isSelected ? 'text-red-500' : 'text-gray-400'} />
                           <div>
                             <p className={`text-sm font-bold ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                               {meta.label}
                               {meta.isCatalog && <span className="ml-2 text-[10px] bg-blue-50 text-blue-500 px-1 rounded uppercase tracking-wider">Catálogo</span>}
                             </p>
                             <p className="text-[10px] text-gray-400 font-mono">{key}</p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         <span className={`text-sm font-black ${count > 0 ? (isSelected ? 'text-red-600' : 'text-gray-700') : 'text-gray-300'}`}>
                           {count}
                         </span>
                         <p className="text-[10px] text-gray-400 leading-none">docs</p>
                      </div>
                    </label>
                  );
               })}
             </div>

            <div className="p-6 mt-auto border-t bg-gray-50">
              {/* Resultado */}
              {clearResult.status !== 'idle' && (
                <div className={`rounded-xl p-3 text-sm mb-4 ${
                  clearResult.status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                  clearResult.status === 'error'   ? 'bg-red-50 text-red-700 border border-red-100' :
                  'bg-gray-50 text-gray-500 border border-gray-200'
                }`}>
                  {clearResult.status === 'loading' && <Loader2 size={14} className="animate-spin inline mr-2" />}
                  {clearResult.status === 'success' && <CheckCircle2 size={14} className="inline mr-2 text-green-600" />}
                  <span className="font-bold">{clearResult.message}</span>
                  {clearResult.status === 'success' && clearResult.details && (
                    <div className="mt-2 text-xs opacity-80 grid grid-cols-2 gap-1 font-mono bg-white/50 p-2 rounded">
                      {Object.entries(clearResult.details).map(([k, v]) => (
                        <span key={k}>{k}: {String(v)} borrados</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botón con confirmación */}
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  disabled={clearResult.status === 'loading' || selectedToClear.size === 0}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Trash2 size={16} />
                  Limpiar {selectedToClear.size} colecciones seleccionadas
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
                  <p className="text-sm text-red-800 font-bold text-center mb-1 flex items-center justify-center gap-2">
                    <AlertTriangle size={18} /> ¿Confirmas la eliminación IRREVERSIBLE?
                  </p>
                  <p className="text-xs text-red-600 text-center mb-4">
                    Estás a punto de vaciar {selectedToClear.size} colecciones de la base de datos Firestore.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar Operación
                    </button>
                    <button
                      onClick={handleClear}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-black hover:bg-red-700 shadow-sm transition-colors"
                    >
                      Sí, vaciar datos ahora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEMBRAR */}
        <section className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sprout size={18} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-green-700">Sembrar Datos de Ejemplo (Seed)</h2>
                <p className="text-xs text-green-500">Selecciona qué colecciones quieres popular con datos</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
               <button onClick={selectAllSeed} className="text-green-600 font-bold hover:underline">Todos</button>
               <span className="text-green-300">|</span>
               <button onClick={selectNoneSeed} className="text-gray-500 font-bold hover:underline">Ninguno</button>
            </div>
          </div>

          <div className="p-0 flex-1 flex flex-col">
             {/* Lista de Checkboxes de Siembras (scrollable si hay muchos) */}
             <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
               {counts && Object.entries(counts).map(([key, count]) => {
                  const meta = colIcons[key] || { icon: Database, label: key, isCatalog: false, dangerLevel: 'low' };
                  const Icon = meta.icon;
                  const isSelected = selectedToSeed.has(key);
                  
                  return (
                    <label 
                      key={`seed-${key}`} 
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50/30' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSeedSelection(key)}
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                           <Icon size={16} className={isSelected ? 'text-green-500' : 'text-gray-400'} />
                           <div>
                             <p className={`text-sm font-bold ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                               {meta.label}
                               {meta.isCatalog && <span className="ml-2 text-[10px] bg-blue-50 text-blue-500 px-1 rounded uppercase tracking-wider">Catálogo</span>}
                             </p>
                             <p className="text-[10px] text-gray-400 font-mono">{key}</p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         <span className={`text-sm font-black ${count > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                           {isSelected ? '+' : count}
                         </span>
                      </div>
                    </label>
                  );
               })}
             </div>

            <div className="p-6 mt-auto border-t bg-gray-50 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
                <AlertTriangle size={18} className="flex-shrink-0 text-blue-500 mt-0.5" />
                <div>
                  <strong>Requisito previo:</strong> Si generas Certificados, debes generar o tener previamente al menos 1 Recinto, Área y Programa.
                </div>
              </div>

              {/* Resultado */}
              {seedResult.status !== 'idle' && (
                <div className={`rounded-xl p-4 text-sm ${
                  seedResult.status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                  seedResult.status === 'error'   ? 'bg-red-50 text-red-700 border border-red-100' :
                  'bg-gray-50 text-gray-500 border border-gray-200'
                }`}>
                  {seedResult.status === 'loading' && <Loader2 size={16} className="animate-spin inline mr-2" />}
                  {seedResult.status === 'success' && <CheckCircle2 size={16} className="inline mr-2 text-green-600" />}
                  <span className="font-bold">{seedResult.message}</span>
                  {seedResult.status === 'success' && seedResult.details && (
                    <div className="mt-2 text-xs opacity-90 p-3 bg-white/60 rounded border border-green-100/50 max-h-32 overflow-y-auto">
                      <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(seedResult.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSeed}
                disabled={seedResult.status === 'loading' || selectedToSeed.size === 0}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-sm"
              >
                {seedResult.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Sprout size={16} />}
                Sembrar {selectedToSeed.size} colecciones seleccionadas
              </button>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
