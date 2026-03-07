"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Briefcase, Save, CheckCircle, AlertCircle, Phone, CreditCard, Loader2 } from 'lucide-react';
import { getStudentRepository } from '@/lib/container';

export default function EditGraduatePage({ params }: { params: any }) {
  const router = useRouter();
  // Unwrap params using React.use() for Next.js 15+
  const { id } = React.use(params) as { id: string };

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    id: '', // Matrícula
    cedula: '',
    email: '',
    phone: '',
    career: '',
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const studentRepo = getStudentRepository();
        const student = await studentRepo.findById(decodeURIComponent(id));
        
        if (!student) {
          setError("Participante no encontrado.");
          return;
        }

        setFormData({
            firstName: student.firstName,
            lastName: student.lastName,
            id: student.id,
            cedula: student.cedula || '',
            email: student.email || '',
            phone: student.phone || '',
            career: student.career || '',
        });

      } catch (err: any) {
        console.error("Error fetching student:", err);
        setError("Error al cargar los datos del participante.");
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
        fetchStudent();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const studentRepo = getStudentRepository();
      
      await studentRepo.update(decodeURIComponent(id), formData);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/graduates/${id}`);
      }, 2000);

    } catch (err: any) {
      console.error("Error updating student:", err);
      setError(err.message || "Error al actualizar el participante.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-gray-500">Cargando datos del participante...</p>
          </div>
      );
  }

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 max-w-4xl mx-auto">
      
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
            Editar Participante
          </h1>
          <p className="text-gray-500">Modifica los datos del estudiante seleccionado.</p>
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
            <h2 className="text-2xl font-bold text-gray-800">¡Participante Actualizado!</h2>
            <p className="text-gray-500">Los cambios han sido guardados exitosamente.</p>
            <p className="text-sm text-gray-400">Redirigiendo al perfil...</p>
         </motion.div>
      ) : (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Identificadores */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User size={16} /> Matrícula (ID Institucional)
                    </label>
                    <input 
                        name="id"
                        value={formData.id}
                        type="text" 
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                        title="La matrícula no se puede modificar"
                    />
                    <p className="text-xs text-gray-400">La matrícula es un identificador único y no puede editarse.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <CreditCard size={16} /> Cédula (Identidad)
                    </label>
                    <input 
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        type="text"
                        placeholder="Ej. 402-1234567-8" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Datos Personales */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nombre(s)</label>
                    <input 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Ej. Juan Andrés"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Apellidos</label>
                    <input 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Ej. Pérez Rodríguez"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Contacto y Carrera */}
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail size={16} /> Correo Electrónico
                    </label>
                    <input 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email" 
                        required
                        placeholder="ejemplo@correo.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Phone size={16} /> Teléfono (Opcional)
                    </label>
                    <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        type="tel" 
                        placeholder="Ej. 809-555-5555"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Briefcase size={16} /> Carrera o Departamento
                    </label>
                    <input 
                        name="career"
                        value={formData.career}
                        onChange={handleChange}
                        type="text" 
                        placeholder="Ej. Ingeniería de Software"
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
                    <Save size={20} /> Guardar Cambios
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
