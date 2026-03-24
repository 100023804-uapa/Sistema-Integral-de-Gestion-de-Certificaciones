"use client";

import React, { useEffect, useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { PlusCircle, Search, Filter, Loader2, FileText, Calendar, User, FileSpreadsheet, X, MapPin, Building, Activity } from 'lucide-react';

import * as XLSX from 'xlsx';

import { getCertificateRepository, getListCampusesUseCase, getListAcademicAreasUseCase } from '@/lib/container';

import { Certificate } from '@/lib/domain/entities/Certificate';
import {
  getCertificateStatusBadgeClass,
  getCertificateStatusLabel,
  isCertificateEmitted,
} from '@/lib/types/certificateStatus';

import { Campus, AcademicArea } from '@/lib/container';

import { useAuth } from '@/lib/contexts/AuthContext';



export default function CertificatesPage() {

  const router = useRouter();

  const { hasRole } = useAuth();

  const repository = getCertificateRepository();

  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [campuses, setCampuses] = useState<Campus[]>([]);

  const [areas, setAreas] = useState<AcademicArea[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  

  // Estados de Filtros

  const [searchTerm, setSearchTerm] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({

    campusId: '',

    academicAreaId: '',

    status: '',

    type: ''

  });



  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        const [certData, campusData, areaData] = await Promise.all([

            repository.findAll(),

            getListCampusesUseCase().execute(true),

            getListAcademicAreasUseCase().execute()

        ]);

        

        setCertificates(certData);

        setCampuses(campusData);

        setAreas(areaData);

      } catch (err) {

        console.error("Error fetching data:", err);

        setError("Error al cargar los datos del sistema.");

      } finally {

        setLoading(false);

      }

    };



    fetchData();

  }, []);



  // Lógica de Filtrado (Memoizada para rendimiento)

  const filteredCertificates = useMemo(() => {

    return certificates.filter(cert => {

      // 1. Búsqueda por texto

      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = searchTerm === '' || 

        cert.studentName.toLowerCase().includes(searchLower) ||

        cert.studentId.toLowerCase().includes(searchLower) ||

        cert.folio.toLowerCase().includes(searchLower) ||

        cert.academicProgram.toLowerCase().includes(searchLower);



      // 2. Filtro por Recinto

      const matchesCampus = !filters.campusId || cert.campusId === filters.campusId;



      // 3. Filtro por Área

      const matchesArea = !filters.academicAreaId || cert.academicAreaId === filters.academicAreaId;



      // 4. Filtro por Estado

      const matchesStatus = !filters.status || cert.status === filters.status;



      // 5. Filtro por Tipo

      const matchesType = !filters.type || cert.type === filters.type;



      return matchesSearch && matchesCampus && matchesArea && matchesStatus && matchesType;

    });

  }, [certificates, searchTerm, filters]);



  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const { name, value } = e.target;

    setFilters(prev => ({ ...prev, [name]: value }));

  };



  const clearFilters = () => {

    setFilters({ campusId: '', academicAreaId: '', status: '', type: '' });

    setSearchTerm('');

  };



  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;



  return (

    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8">

      {/* Header */}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div>

                <h1 className="text-4xl font-black text-primary tracking-tighter">Certificados</h1>

                <p className="text-gray-500 font-medium">Gestiona y consulta el historial de emisiones institucionales.</p>

              </div>

              <div className="flex flex-wrap gap-3">

                  <button 

                      onClick={() => {

                          const ws = XLSX.utils.json_to_sheet(filteredCertificates.map(c => ({

                              Folio: c.folio,

                              Estudiante: c.studentName,

                              Matricula: c.studentId,

                              Programa: c.academicProgram,

                              Tipo: c.type,

                              Fecha: c.issueDate.toLocaleDateString(),

                              Estado: c.status,

                              Recinto: campuses.find(camp => camp.id === c.campusId)?.name || 'N/A'

                          })));

                          const wb = XLSX.utils.book_new();

                          XLSX.utils.book_append_sheet(wb, ws, "Certificados");

                          XLSX.writeFile(wb, `SIGCE_Certificados_${new Date().toISOString().slice(0,10)}.xlsx`);

                      }}

                      className="px-4 py-3 rounded-xl bg-green-50 text-green-700 font-bold border border-green-100 hover:bg-green-100 transition-colors flex items-center gap-2"

                  >

                      <FileSpreadsheet size={20} /> Exportar

                  </button>

                  {hasRole(['administrator', 'coordinator']) && (

                    <button 

                        onClick={() => router.push('/dashboard/certificates/create')}

                        className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"

                    >

                        <PlusCircle size={20} /> Nuevo Certificado

                    </button>

                  )}

              </div>

            </div>



      {/* Search & Advanced Filters */}

      <div className="space-y-4">

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2">

            <div className="relative flex-1">

                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />

                <input 

                    type="text" 

                    value={searchTerm}

                    onChange={(e) => setSearchTerm(e.target.value)}

                    placeholder="Buscar por nombre, matrícula, folio o programa académico..." 

                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder:text-gray-400 font-medium"

                />

                {searchTerm && (

                    <button 

                        onClick={() => setSearchTerm('')}

                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"

                    >

                        <X size={20} />

                    </button>

                )}

            </div>

            <button 

                onClick={() => setShowFilters(!showFilters)}

                className={`px-6 py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold ${

                    showFilters || activeFiltersCount > 0 

                    ? 'bg-accent/10 border-accent/20 text-accent' 

                    : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'

                }`}

            >

                <Filter size={20} /> 

                Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}

            </button>

        </div>



        {/* Panel de Filtros Expandible */}

        {showFilters && (

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">

                <div className="space-y-2">

                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">

                        <MapPin size={12} /> Recinto

                    </label>

                    <select 

                        name="campusId"

                        value={filters.campusId}

                        onChange={handleFilterChange}

                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20"

                    >

                        <option value="">Todos los Recintos</option>

                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}

                    </select>

                </div>



                <div className="space-y-2">

                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">

                        <Building size={12} /> Área Académica

                    </label>

                    <select 

                        name="academicAreaId"

                        value={filters.academicAreaId}

                        onChange={handleFilterChange}

                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20"

                    >

                        <option value="">Todas las Áreas</option>

                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}

                    </select>

                </div>



                <div className="space-y-2">

                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">

                        <Activity size={12} /> Estado

                    </label>

                    <select 

                        name="status"

                        value={filters.status}

                        onChange={handleFilterChange}

                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20"

                    >

                        <option value="">Cualquier Estado</option>

                        <option value="draft">Borrador</option>

                        <option value="pending_review">Espera de verificación</option>

                        <option value="verified">Verificado</option>

                        <option value="pending_signature">Espera de firma</option>

                        <option value="signed">Firmado</option>

                        <option value="issued">Emitido</option>

                        <option value="blocked_payment">Bloqueado por pago</option>

                        <option value="blocked_documents">Bloqueado por documentacion</option>

                        <option value="blocked_administrative">Bloqueado administrativo</option>

                        <option value="cancelled">Cancelado</option>

                    </select>

                </div>



                <div className="space-y-2">

                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">

                        <FileText size={12} /> Tipo

                    </label>

                    <div className="flex items-center gap-2 h-10">

                        <select 

                            name="type"

                            value={filters.type}

                            onChange={handleFilterChange}

                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20"

                        >

                            <option value="">Todos</option>

                            <option value="CAP">CAP</option>

                            <option value="PROFUNDO">PROFUNDO</option>

                        </select>

                        <button 

                            onClick={clearFilters}

                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"

                            title="Limpiar filtros"

                        >

                            <X size={20} />

                        </button>

                    </div>

                </div>

            </div>

        )}

      </div>



      {/* Stats Quick Look */}

      {!searchTerm && !showFilters && (

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Listados</p>

                  <p className="text-2xl font-black text-primary">{filteredCertificates.length}</p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Emitidos</p>

                  <p className="text-2xl font-black text-green-600">{filteredCertificates.filter(c => isCertificateEmitted(c.status)).length}</p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bloqueados</p>

                  <p className="text-2xl font-black text-red-600">{filteredCertificates.filter(c => ['blocked_payment', 'blocked_documents', 'blocked_administrative', 'cancelled', 'revoked'].includes(c.status)).length}</p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">En Flujo</p>

                  <p className="text-2xl font-black text-amber-600">{filteredCertificates.filter(c => !isCertificateEmitted(c.status) && !['blocked_payment', 'blocked_documents', 'blocked_administrative', 'cancelled', 'revoked'].includes(c.status)).length}</p>

              </div>

          </div>

      )}



      {/* Content Table */}

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">

        {loading ? (

            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">

                <Loader2 className="w-10 h-10 text-primary animate-spin" />

                <p className="text-gray-400 font-medium">Sincronizando registros académicos...</p>

            </div>

        ) : error ? (

            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-8">

                <p className="text-red-500 font-bold">{error}</p>

                 <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Intentar de nuevo</button>

            </div>

        ) : filteredCertificates.length === 0 ? (

            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-8">

                <div className="bg-gray-50 p-8 rounded-full inline-block">

                    <Search className="w-16 h-16 text-gray-200" />

                </div>

                <h3 className="text-xl font-bold text-gray-800">No se encontraron resultados</h3>

                <p className="text-gray-400 max-w-sm mx-auto">Ajusta los filtros o la búsqueda para encontrar lo que buscas.</p>

                {activeFiltersCount > 0 && (

                    <button onClick={clearFilters} className="text-primary font-bold hover:underline">Limpiar todos los filtros</button>

                )}

            </div>

        ) : (

            <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse">

                    <thead>

                        <tr className="bg-gray-50/50 border-b border-gray-100">

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em]">Identificador / Folio</th>

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em]">Participante</th>

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em]">Programa / Recinto</th>

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em]">Emisión</th>

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em]">Estado</th>

                            <th className="px-6 py-5 font-black text-gray-400 text-[10px] uppercase tracking-[0.15em] text-right">Detalles</th>

                        </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-50">

                        {filteredCertificates.map((cert) => {

                            const campus = campuses.find(c => c.id === cert.campusId);

                            return (

                                <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors group">

                                    <td className="px-6 py-5">

                                        <div className="flex flex-col gap-1">

                                            <span className="font-mono text-xs font-black bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg w-fit">

                                                {cert.folio}

                                            </span>

                                            {cert.publicVerificationCode && (

                                                <span className="text-[10px] text-accent font-bold tracking-tight">

                                                    HASH: {cert.publicVerificationCode}

                                                </span>

                                            )}

                                        </div>

                                    </td>

                                    <td className="px-6 py-5">

                                        <div className="flex items-center gap-3">

                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">

                                                {cert.studentName.charAt(0)}

                                            </div>

                                            <div>

                                                <p className="font-bold text-gray-900 leading-tight">{cert.studentName}</p>

                                                <p className="text-xs text-gray-400 font-medium">{cert.studentId}</p>

                                            </div>

                                        </div>

                                    </td>

                                    <td className="px-6 py-5">

                                        <p className="text-sm font-bold text-gray-700 max-w-[200px] truncate" title={cert.academicProgram}>

                                            {cert.academicProgram}

                                        </p>

                                        <p className="text-[11px] text-gray-400 font-bold flex items-center gap-1">

                                            <MapPin size={10} /> {campus?.name || 'Recinto no especificado'}

                                        </p>

                                    </td>

                                    <td className="px-6 py-5">

                                        <div className="flex flex-col">

                                            <span className="text-sm font-bold text-gray-700">

                                                {cert.issueDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}

                                            </span>

                                            <span className="text-[10px] text-gray-400 font-medium">Emisión oficial</span>

                                        </div>

                                    </td>

                                    <td className="px-6 py-5">

                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCertificateStatusBadgeClass(cert.status)}`}>

                                            {getCertificateStatusLabel(cert.status)}

                                        </span>

                                    </td>

                                    <td className="px-6 py-5">
 
                                        <div className="flex flex-col items-end gap-2">
 
                                            <button 
 
                                                onClick={() => router.push(`/dashboard/certificates/${cert.id}`)}
 
                                                className="px-4 py-2 rounded-xl text-primary font-bold hover:bg-primary/5 transition-all text-sm border border-transparent hover:border-primary/10"
 
                                            >
 
                                                Ver Historial
 
                                            </button>

                                            <button

                                                onClick={() => router.push(`/dashboard/graduates/${encodeURIComponent(cert.studentId)}`)}

                                                className="px-4 py-2 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm border border-gray-200"

                                            >

                                                Ver Participante

                                            </button>

                                        </div>
 
                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        )}

      </div>

    </div>

  );

}


