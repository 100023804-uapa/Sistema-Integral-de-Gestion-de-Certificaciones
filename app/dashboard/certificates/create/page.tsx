"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, FileText, Calendar, Save, CheckCircle, AlertCircle, MapPin, Search } from 'lucide-react';
import { getCreateCertificateUseCase, getCertificateTemplateRepository, getListCampusesUseCase, getListCertificateTypesUseCase } from '@/lib/container';
import { CertificateType } from '@/lib/domain/entities/Certificate';
import { Campus, CertificateType as CertType } from '@/lib/container';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { LayoutTemplate } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StudentCombobox } from '@/components/ui/StudentCombobox';
import { ProgramCombobox } from '@/components/ui/ProgramCombobox';
import { Student } from '@/lib/domain/entities/Student';

export default function CreateCertificatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [certTypes, setCertTypes] = useState<CertType[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [programs, setPrograms] = useState<{ id: string; name: string; code: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    cedula: '',
    studentEmail: '',
    academicProgram: '',
    type: 'CAP' as CertificateType,
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    folioPrefix: 'sigce', // Default prefix
    templateId: '',
    campusId: '', // Nuevo: obligatorio
    signer1Id: '', // Nuevo
    signer2Id: '', // Nuevo
  });

  const [activeSigners, setActiveSigners] = useState<any[]>([]);

  useEffect(() => {
    const fetchSigners = async () => {
        try {
            const res = await fetch('/api/admin/signers?active=true');
            const data = await res.json();
            if (data.success) setActiveSigners(data.data);
        } catch (err) {
            console.error("Error fetching signers", err);
        }
    };
    fetchSigners();
  }, []);

  useEffect(() => {
    // Prepoblar datos si venimos de "Anular y Corregir"
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('studentId');
      const studentName = params.get('studentName');
      const cedula = params.get('cedula');
      const program = params.get('program');
      const type = params.get('type');
      
      setFormData(prev => ({
          ...prev,
          ...(studentId && { studentId }),
          ...(studentName && { studentName }),
          ...(cedula && { cedula }),
          ...(program && { academicProgram: program }),
          ...(type && { type: type as CertificateType }),
      }));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const templateRepo = getCertificateTemplateRepository();
            const templateData = await templateRepo.list(true);
            setTemplates(templateData);

            const listCampusesUseCase = getListCampusesUseCase();
            const campusData = await listCampusesUseCase.execute(true);
            setCampuses(campusData);

            const listTypesUseCase = getListCertificateTypesUseCase();
            const typesData = await listTypesUseCase.execute(true);
            setCertTypes(typesData);

            const progRes = await fetch('/api/admin/academic-programs?active=true');
            const progData = await progRes.json();
            if (progData.success) setPrograms(progData.data);
        } catch (err) {
            console.error("Error loading data", err);
        }
    };
    fetchData();
  }, []);

  // Filtrar plantillas según tipo de layout seleccionado
  const filteredTemplates = selectedTemplateType
    ? templates.filter(t => t.type === selectedTemplateType)
    : templates;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        const createCertificate = getCreateCertificateUseCase();
        await createCertificate.execute({
            ...formData,
            issueDate: new Date(formData.issueDate),
            prefix: formData.folioPrefix || undefined,
            cedula: formData.cedula,
            studentEmail: '',
            templateId: formData.templateId || undefined,
            campusId: formData.campusId,
            createdBy: user?.uid || 'system',
        });

        setSuccess(true);
        setTimeout(() => {
            router.push('/dashboard/certificates');
        }, 2000);

    } catch (err: any) {
        console.error("Error creating certificate:", err);
        setError(err.message || "Error al crear el certificado. Intente nuevamente.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">
            Nuevo Certificado
          </h1>
          <p className="text-gray-500">Completa los datos del estudiante para generar un folio único.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle size={20} />
            <span>{error}</span>
        </div>
      )}

      {success ? (
         <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-green-100 text-center space-y-4"
         >
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">¡Certificado Creado!</h2>
            <p className="text-gray-500">El certificado se ha generado y registrado correctamente.</p>
            <p className="text-sm text-gray-400">Redirigiendo al listado...</p>
         </motion.div>
      ) : (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campus Selection - OBLIGATORIO */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin size={16} /> Recinto Institucional *
                </label>
                <select 
                    name="campusId"
                    value={formData.campusId} 
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                    <option value="">Selecciona un recinto</option>
                    {campuses.map(campus => (
                        <option key={campus.id} value={campus.id}>
                            {campus.name} ({campus.code})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-red-500">
                    * Campo obligatorio. El certificado debe estar asociado a un recinto.
                </p>
            </div>

            {/* Tipo de Layout (filtro de plantillas) */}
            {certTypes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <LayoutTemplate size={16} /> Tipo de Certificado (Layout Visual)
                </label>
                <select
                  value={selectedTemplateType}
                  onChange={(e) => {
                    const newTypeStr = e.target.value;
                    setSelectedTemplateType(newTypeStr);
                    
                    const selectedCertType = certTypes.find(ct => ct.code === newTypeStr);
                    const newPrefix = selectedCertType?.defaultFolioPrefix || 'sigce';
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      templateId: '', 
                      folioPrefix: newPrefix 
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                  <option value="">Todos los tipos</option>
                  {certTypes.map(ct => (
                    <option key={ct.id} value={ct.code}>{ct.name} ({ct.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <LayoutTemplate size={16} /> Plantilla de Diseño
                </label>
                <select 
                    name="templateId"
                    value={formData.templateId} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                    <option value="">Predeterminada (Sistema)</option>
                    {filteredTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500">
                    {selectedTemplateType
                      ? `Mostrando plantillas de tipo "${selectedTemplateType}". Cambia el tipo arriba para ver otras.`
                      : 'Selecciona una plantilla visual o usa el formato estándar del sistema.'}
                </p>
            </div>

            {/* Signers Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User size={16} /> Firmante Autorizado 1
                    </label>
                    <select 
                        name="signer1Id"
                        value={formData.signer1Id} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    >
                        <option value="">Ninguno</option>
                        {activeSigners.map(signer => (
                            <option key={signer.id} value={signer.id}>
                                {signer.name} ({signer.title})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User size={16} /> Firmante Autorizado 2
                    </label>
                    <select 
                        name="signer2Id"
                        value={formData.signer2Id} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    >
                        <option value="">Ninguno</option>
                        {activeSigners.map(signer => (
                            <option key={signer.id} value={signer.id}>
                                {signer.name} ({signer.title})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Folio Prefix Configuration */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={16} /> Configuración de Folio (Prefijo)
                </label>
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        name="folioPrefix"
                        value={formData.folioPrefix} 
                        onChange={handleChange}
                        placeholder="Ej. SIGCE"
                        className="flex-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                    />
                    <span className="text-gray-400 font-mono text-sm whitespace-nowrap">
                        - {new Date().getFullYear()} - {formData.type} - 0001
                    </span>
                </div>
                <p className="text-xs text-gray-500">
                    Personaliza el identificador inicial. El resto se genera automáticamente.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0 relative">
                
                {/* Buscador Rápido (Ocupa las dos columnas) */}
                <div className="md:col-span-2 space-y-2 mb-2 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Search size={16} className="text-primary" /> Buscar Participante
                    </label>
                    <StudentCombobox 
                        onSelect={(student: Student) => {
                            setFormData(prev => ({
                                ...prev,
                                studentName: `${student.firstName} ${student.lastName}`.trim(),
                                studentId: student.id,
                                cedula: student.cedula || prev.cedula,
                                studentEmail: student.email || prev.studentEmail,
                                academicProgram: student.career || prev.academicProgram,
                            }));
                        }}
                    />
                    <p className="text-xs text-gray-500">
                        Busca y selecciona un participante para autocompletar los campos de abajo.
                    </p>
                </div>

                {/* Estudiante */}
                <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                    <User size={16} className="inline mr-2 text-primary" /> Nombre del Estudiante
                </label>
                <input 
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    type="text" 
                    required
                    readOnly
                    placeholder="Se autocompleta con la búsqueda..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User size={16} /> Matrícula (Institucional)
                </label>
                <input 
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    type="text" 
                    required
                    readOnly
                    placeholder="Se autocompleta con la búsqueda..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User size={16} /> Cédula (Identidad)
                </label>
                <input 
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    type="text" 
                    readOnly
                    placeholder="Se autocompleta con la búsqueda..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
                </div>

                {/* Programa */}
                <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={16} /> Programa Académico
                </label>
                <ProgramCombobox 
                    programs={programs}
                    value={formData.academicProgram}
                    onChange={(val) => setFormData(prev => ({ ...prev, academicProgram: val }))}
                />
                <p className="text-xs text-gray-400">
                  {programs.length === 0 ? 'Agrega programas en el módulo «Programas Académicos» para usar la lista desplegable.' : `${programs.length} programas disponibles en el catálogo.`}
                </p>
                </div>

                {/* Tipo y Fecha */}
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={16} /> Tipo de Certificado
                </label>
                <select 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                    <option value="CAP">CAP (Certificado de Aprobación)</option>
                    <option value="PROFUNDO">PROFUNDO (Diplomado Avanzado)</option>
                </select>
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> Fecha de Emisión
                </label>
                <input 
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleChange}
                    type="date" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                >
                Cancelar
                </button>
                <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {loading ? 'Guardando...' : (
                    <>
                    <Save size={20} /> Generar Certificado
                    </>
                )}
                </button>
            </div>

            </form>
        </motion.div>
      )}
    </div>
  );
}
