"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react';

import { getListCampusesUseCase, getStudentRepository } from '@/lib/container';
import type { AcademicArea } from '@/lib/types/academicArea';
import type { AcademicProgram } from '@/lib/types/academicProgram';
import type { Campus } from '@/lib/types/campus';

type FormState = {
  firstName: string;
  lastName: string;
  id: string;
  cedula: string;
  email: string;
  phone: string;
  campusId: string;
  academicAreaId: string;
  programId: string;
};

export default function CreateGraduatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [areas, setAreas] = useState<AcademicArea[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);

  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    id: '',
    cedula: '',
    email: '',
    phone: '',
    campusId: '',
    academicAreaId: '',
    programId: '',
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [campusData, programsResponse] = await Promise.all([
          getListCampusesUseCase().execute(true),
          fetch('/api/admin/academic-programs?active=true'),
        ]);

        setCampuses(campusData);

        const programsPayload = await programsResponse.json();
        if (programsPayload.success) {
          setPrograms(programsPayload.data || []);
        } else {
          setPrograms([]);
        }
      } catch (catalogError) {
        console.error('Error loading participant catalogs:', catalogError);
        setError('No fue posible cargar los catálogos institucionales.');
      } finally {
        setLoadingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, []);

  useEffect(() => {
    const loadAcademicAreas = async () => {
      if (!formData.campusId) {
        setAreas([]);
        setFormData((prev) => ({ ...prev, academicAreaId: '' }));
        return;
      }

      try {
        const response = await fetch(
          `/api/admin/academic-areas?campusId=${formData.campusId}&activeOnly=true`
        );
        const payload = await response.json();

        if (payload.success) {
          setAreas(payload.data || []);
        } else {
          setAreas([]);
        }
      } catch (areaError) {
        console.error('Error loading academic areas for participants:', areaError);
        setAreas([]);
      }
    };

    loadAcademicAreas();
  }, [formData.campusId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'campusId' ? { academicAreaId: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const studentRepo = getStudentRepository();
      const existingStudent = await studentRepo.findById(formData.id);
      if (existingStudent) {
        throw new Error(`El participante con matrícula ${formData.id} ya existe.`);
      }

      const selectedCampus = campuses.find((campus) => campus.id === formData.campusId);
      const selectedArea = areas.find((area) => area.id === formData.academicAreaId);
      const selectedProgram = programs.find((program) => program.id === formData.programId);

      if (!selectedCampus) {
        throw new Error('Debes seleccionar un recinto institucional válido.');
      }

      if (!selectedProgram) {
        throw new Error('Debes seleccionar un programa académico válido.');
      }

      await studentRepo.create({
        id: formData.id.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        cedula: formData.cedula.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        career: selectedProgram.name,
        programId: selectedProgram.id,
        programNameSnapshot: selectedProgram.name,
        campusId: selectedCampus.id,
        campusNameSnapshot: selectedCampus.name,
        academicAreaId: selectedArea?.id || undefined,
        academicAreaNameSnapshot: selectedArea?.name || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/graduates');
      }, 2000);
    } catch (submitError: any) {
      console.error('Error creating student:', submitError);
      setError(submitError.message || 'Error al registrar el participante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">
            Nuevo Participante
          </h1>
          <p className="text-gray-500">
            Registra la ficha del participante usando los catálogos institucionales.
          </p>
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
          <h2 className="text-2xl font-bold text-gray-800">¡Participante Registrado!</h2>
          <p className="text-gray-500">La ficha institucional fue guardada exitosamente.</p>
          <p className="text-sm text-gray-400">Redirigiendo al listado...</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} /> Matrícula (ID Institucional)
                </label>
                <input
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  type="text"
                  required
                  placeholder="Ej. 2024-0050"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
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
                  <Phone size={16} /> Teléfono
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 size={16} /> Recinto Institucional
                </label>
                <select
                  name="campusId"
                  value={formData.campusId}
                  onChange={handleChange}
                  required
                  disabled={loadingCatalogs}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
                >
                  <option value="">
                    {loadingCatalogs ? 'Cargando recintos...' : 'Selecciona un recinto'}
                  </option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name} ({campus.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} /> Área Académica
                </label>
                <select
                  name="academicAreaId"
                  value={formData.academicAreaId}
                  onChange={handleChange}
                  disabled={!formData.campusId || loadingCatalogs}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
                >
                  <option value="">
                    {!formData.campusId
                      ? 'Primero selecciona un recinto'
                      : 'Selecciona un área (opcional)'}
                  </option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name} ({area.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase size={16} /> Programa Académico
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleChange}
                  required
                  disabled={loadingCatalogs}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
                >
                  <option value="">
                    {loadingCatalogs ? 'Cargando programas...' : 'Selecciona un programa'}
                  </option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  El nombre del programa se guarda también como snapshot para mantener compatibilidad con los módulos legacy.
                </p>
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
                disabled={loading || loadingCatalogs}
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save size={20} /> Guardar Participante
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
