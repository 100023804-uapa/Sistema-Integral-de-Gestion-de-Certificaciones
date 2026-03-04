"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Filter, Loader2, User, FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getStudentRepository, QueryDocumentSnapshot } from '@/lib/container';
import { Student } from '@/lib/domain/entities/Student';

export default function GraduatesPage() {
  const router = useRouter();
  const studentRepo = getStudentRepository();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | undefined>();
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async (cursor?: QueryDocumentSnapshot, reset: boolean = false) => {
    try {
      setLoading(true);
      const result = await studentRepo.listPaginated(cursor);
      if (reset) {
        setStudents(result.data);
      } else {
        setStudents(prev => cursor ? [...prev, ...result.data] : result.data);
      }
      setHasMore(result.hasMore);
      setLastVisible(result.lastVisible);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore && lastVisible) {
      loadStudents(lastVisible);
      setPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      loadStudents(undefined, true);
      setPage(0);
    }
  };

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">Participantes</h1>
          <p className="text-gray-500">Consulta la base de datos de participantes certificados.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => {
                    const ws = XLSX.utils.json_to_sheet([
                        { Matricula: "2024-0001", Cedula: "402-1234567-8", Nombre: "Juan Perez", Email: "juan@ejemplo.com", Carrera: "Informática" },
                        { Matricula: "2024-0002", Cedula: "001-9876543-2", Nombre: "Maria Garcia", Email: "maria@ejemplo.com", Carrera: "Telemática" }
                    ]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
                    XLSX.writeFile(wb, "Plantilla_Carga_SIGCE.xlsx");
                }}
                className="px-4 py-3 rounded-xl bg-green-50 text-green-700 font-bold border border-green-100 hover:bg-green-100 transition-colors flex items-center gap-2"
            >
                <FileSpreadsheet size={20} /> Plantilla
            </button>
            <button 
            onClick={() => router.push('/dashboard/certificates/import')}
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

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Buscar por nombre o matrícula..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
        </div>
        <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 font-medium">
            <Filter size={18} /> Filtros
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Cargando graduados...</p>
            </div>
        ) : filteredStudents.length === 0 ? (
            <div className="text-center space-y-4 p-20">
                <div className="bg-gray-50 p-6 rounded-full inline-block">
                    <Search className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No se encontraron graduados</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Intenta ajustar tu búsqueda o importa nuevos estudiantes.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Estudiante</th>
                            <th className="px-6 py-4">Matrícula / Cédula</th>
                            <th className="px-6 py-4">Carrera</th>
                            <th className="px-6 py-4">Fecha Registro</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            {student.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{student.firstName} {student.lastName}</div>
                                            <div className="text-xs text-gray-400">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700">
                                    {student.id}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {student.career || 'No especificada'}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {student.createdAt.toLocaleDateString('es-DO', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => router.push(`/dashboard/graduates/${student.id}`)}
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

        {/* Paginación */}
        {!loading && students.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Página {page + 1}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={handleNextPage}
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
