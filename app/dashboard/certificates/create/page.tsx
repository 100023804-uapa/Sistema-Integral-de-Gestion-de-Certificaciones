"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  LayoutTemplate,
  Mail,
  MapPin,
  PenTool,
  Save,
  User,
} from 'lucide-react';
import {
  getCertificateRepository,
  getCertificateTemplateRepository,
  getCreateCertificateUseCase,
  getListCampusesUseCase,
  getStudentRepository,
} from '@/lib/container';
import { CertificateType } from '@/lib/domain/entities/Certificate';
import { Student } from '@/lib/domain/entities/Student';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StudentCombobox } from '@/components/ui/StudentCombobox';
import type { AcademicProgram } from '@/lib/types/academicProgram';
import type { CertificateTemplate } from '@/lib/types/certificateTemplate';
import type { Campus } from '@/lib/types/campus';
import type { Signer } from '@/lib/types/signer';
import {
  filterApprovedTemplatesForIssuance,
  findPreferredTemplateForIssuance,
  getTemplateIssuancePolicyMessage,
} from '@/lib/config/certificate-template-policy';

type FormState = {
  programId: string;
  type: CertificateType;
  issueDate: string;
  expirationDate: string;
  folioPrefix: string;
  templateId: string;
  campusId: string;
  signer1Id: string;
  signer2Id: string;
};

export default function CreateCertificatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const certificateRepository = React.useMemo(() => getCertificateRepository(), []);
  const studentRepository = React.useMemo(() => getStudentRepository(), []);
  const draftId = searchParams.get('draftId');
  const isEditMode = Boolean(draftId);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);

  const [formData, setFormData] = useState<FormState>({
    programId: '',
    type: 'CAP',
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    folioPrefix: 'sigce',
    templateId: '',
    campusId: '',
    signer1Id: '',
    signer2Id: '',
  });

  useEffect(() => {
    const formatDateInput = (value?: Date | null) => {
      if (!value) return '';
      return new Date(value).toISOString().split('T')[0];
    };

    const fetchData = async () => {
      try {
        setInitializing(true);
        const templateRepo = getCertificateTemplateRepository();
        const listCampusesUseCase = getListCampusesUseCase();

        const [templateData, campusData, programsResponse, signersResponse] =
          await Promise.all([
            templateRepo.list(true),
            listCampusesUseCase.execute(true),
            fetch('/api/admin/academic-programs?active=true'),
            fetch('/api/admin/signers?active=true'),
          ]);

        const approvedTemplates = filterApprovedTemplatesForIssuance(templateData);
        setTemplates(approvedTemplates);
        setCampuses(campusData);

        const programsPayload = await programsResponse.json();
        if (programsPayload.success) {
          setPrograms(programsPayload.data || []);
        } else {
          setPrograms([]);
        }

        const signersPayload = await signersResponse.json();
        if (signersPayload.success) {
          setSigners(signersPayload.data || []);
        } else {
          setSigners([]);
        }

        const preferredTemplate = findPreferredTemplateForIssuance(templateData);
        if (preferredTemplate) {
          setFormData((current) => ({
            ...current,
            templateId: current.templateId || preferredTemplate.id,
          }));
        }

        if (draftId) {
          const draftCertificate = await certificateRepository.findById(draftId);

          if (!draftCertificate) {
            throw new Error('El borrador seleccionado no existe o ya no está disponible.');
          }

          if (draftCertificate.status !== 'draft') {
            throw new Error(
              'Solo los certificados en borrador pueden editarse desde este formulario.'
            );
          }

          const draftStudent = await studentRepository.findById(
            draftCertificate.studentId
          );

          if (!draftStudent) {
            throw new Error(
              'La ficha del participante vinculada a este borrador ya no está disponible.'
            );
          }

          setSelectedStudent(draftStudent);
          setFormData({
            programId: draftCertificate.programId || '',
            type: draftCertificate.type,
            issueDate: formatDateInput(draftCertificate.issueDate),
            expirationDate: formatDateInput(draftCertificate.expirationDate),
            folioPrefix: draftCertificate.folio.split('-')[0] || 'sigce',
            templateId:
              draftCertificate.templateId || preferredTemplate?.id || '',
            campusId: draftCertificate.campusId || draftStudent.campusId || '',
            signer1Id: draftCertificate.signer1Id || '',
            signer2Id: draftCertificate.signer2Id || '',
          });
        }
      } catch (fetchError) {
        console.error('Error loading certificate creation catalogs:', fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'No fue posible cargar el formulario del certificado.'
        );
      } finally {
        setInitializing(false);
      }
    };

    void fetchData();
  }, [certificateRepository, draftId, studentRepository]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setError(null);
    setFormData((current) => ({
      ...current,
      campusId: current.campusId || student.campusId || '',
      programId: current.programId || student.programId || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.uid) {
        throw new Error('No se pudo identificar el usuario autenticado.');
      }

      if (!selectedStudent) {
        throw new Error(
          'Debes seleccionar un participante registrado antes de crear el certificado.'
        );
      }

      if (!formData.programId) {
        throw new Error(
          'Debes seleccionar un programa académico activo para el certificado.'
        );
      }

      if (!formData.templateId) {
        throw new Error(
          'Debes seleccionar una plantilla institucional antes de generar el borrador.'
        );
      }

      if (!formData.signer1Id) {
        throw new Error(
          'Debes seleccionar una autoridad firmante principal antes de generar el borrador.'
        );
      }

      if (!formData.campusId) {
        throw new Error('Debes seleccionar el recinto institucional del certificado.');
      }

      const selectedProgram = programs.find(
        (program) => program.id === formData.programId
      );

      if (!selectedProgram) {
        throw new Error(
          'El programa académico seleccionado no está disponible en el catálogo activo.'
        );
      }

      if (isEditMode && draftId) {
        const response = await fetch(
          `/api/admin/certificates/${encodeURIComponent(draftId)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: selectedStudent.id,
              programId: selectedProgram.id,
              templateId: formData.templateId,
              campusId: formData.campusId,
              issueDate: formData.issueDate,
              expirationDate: formData.expirationDate || null,
              signer1Id: formData.signer1Id,
              signer2Id: formData.signer2Id || null,
            }),
          }
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.error ||
              'No fue posible actualizar el borrador del certificado.'
          );
        }
      } else {
        const createCertificate = getCreateCertificateUseCase();
        await createCertificate.execute({
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim(),
          studentId: selectedStudent.id,
          cedula: selectedStudent.cedula || undefined,
          studentEmail: selectedStudent.email || undefined,
          academicProgram: selectedProgram.name,
          programId: selectedProgram.id,
          type: formData.type,
          issueDate: new Date(formData.issueDate),
          expirationDate: formData.expirationDate
            ? new Date(formData.expirationDate)
            : undefined,
          prefix: formData.folioPrefix || undefined,
          templateId: formData.templateId,
          campusId: formData.campusId,
          createdBy: user.uid,
          signer1Id: formData.signer1Id,
          signer2Id: formData.signer2Id || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(
          isEditMode && draftId
            ? `/dashboard/certificates/${encodeURIComponent(draftId)}`
            : '/dashboard/certificates'
        );
      }, 1800);
    } catch (submitError: any) {
      console.error('Error creating certificate:', submitError);
      setError(
        submitError.message ||
          'Error al crear el certificado. Intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">
            {isEditMode ? 'Editar Borrador' : 'Nuevo Certificado'}
          </h1>
          <p className="text-gray-500">
            {isEditMode
              ? 'Ajusta participante, programa, plantilla y autoridades firmantes mientras el certificado siga en borrador.'
              : 'Selecciona participante, programa, plantilla y autoridades firmantes para crear un borrador consistente con el flujo institucional.'}
          </p>
        </div>
      </div>

      {initializing && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-sm text-gray-600">
            {isEditMode
              ? 'Cargando borrador para edición...'
              : 'Cargando catálogos institucionales...'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-green-100 bg-white p-12 text-center shadow-sm"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Borrador actualizado' : 'Certificado creado'}
          </h2>
          <p className="text-gray-500">
            {isEditMode
              ? 'Los cambios del borrador quedaron guardados y ya puedes revisar el certificado actualizado.'
              : 'El borrador quedó registrado con plantilla, programa y autoridades firmantes.'}
          </p>
          <p className="text-sm text-gray-400">
            {isEditMode ? 'Volviendo al detalle del certificado...' : 'Redirigiendo al listado...'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
        >
          {isEditMode && (
            <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-primary">
              Este formulario solo permite editar borradores. Si el certificado cambia
              de estado, deberás continuar su flujo desde <strong>Estados</strong>.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User size={16} /> Participante registrado *
              </label>
              <StudentCombobox onSelect={handleSelectStudent} />
              <p className="text-xs text-gray-500">
                La creación manual ya no debe inventar participantes. Selecciona
                una ficha existente del sistema.
              </p>
            </div>

            {selectedStudent && (
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Participante
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Matrícula: {selectedStudent.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Contacto
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                    <Mail size={14} className="text-primary" />
                    {selectedStudent.email || 'Sin correo registrado'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cédula: {selectedStudent.cedula || 'No registrada'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin size={16} /> Recinto institucional *
                </label>
                <select
                  name="campusId"
                  value={formData.campusId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona un recinto</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name} ({campus.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <LayoutTemplate size={16} /> Plantilla institucional *
                </label>
                <select
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona una plantilla activa</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {getTemplateIssuancePolicyMessage()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText size={16} /> Programa académico *
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona un programa activo</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  El programa del certificado debe salir del catálogo, no de un
                  texto libre.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText size={16} /> Tipo de certificado
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="CAP">CAP (Certificado de Aprobación)</option>
                  <option value="PROFUNDO">
                    PROFUNDO (Diplomado Avanzado)
                  </option>
                </select>
                {isEditMode && (
                  <p className="text-xs text-gray-500">
                    El tipo y el folio ya fueron reservados para este borrador. Si
                    necesitas otro tipo, crea un certificado nuevo.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <PenTool size={16} /> Autoridad firmante principal *
                </label>
                <select
                  name="signer1Id"
                  value={formData.signer1Id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona la autoridad principal</option>
                  {signers.map((signer) => (
                    <option key={signer.id} value={signer.id}>
                      {signer.name} ({signer.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <PenTool size={16} /> Autoridad firmante secundaria
                </label>
                <select
                  name="signer2Id"
                  value={formData.signer2Id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin segunda autoridad</option>
                  {signers.map((signer) => (
                    <option key={signer.id} value={signer.id}>
                      {signer.name} ({signer.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} /> Fecha de emisión
                </label>
                <input
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  type="date"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} /> Fecha de expiración
                </label>
                <input
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} /> Configuración de folio (prefijo)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="folioPrefix"
                  value={formData.folioPrefix}
                  onChange={handleChange}
                  placeholder="Ej. SIGCE"
                  disabled={isEditMode}
                  className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 uppercase transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="whitespace-nowrap font-mono text-sm text-gray-400">
                  - {new Date().getFullYear()} - {formData.type} - 0001
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl px-6 py-3 font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || initializing}
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  isEditMode ? 'Guardando cambios...' : 'Guardando...'
                ) : (
                  <>
                    <Save size={20} />{' '}
                    {isEditMode ? 'Guardar cambios' : 'Generar Certificado'}
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
