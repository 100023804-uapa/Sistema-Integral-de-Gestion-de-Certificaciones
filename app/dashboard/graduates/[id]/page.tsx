'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, GraduationCap, Calendar, FileText, Loader2, Award, AlertCircle } from 'lucide-react';
import { getCertificateRepository, getStudentRepository } from '@/lib/container';
import { Student } from '@/lib/domain/entities/Student';
import { Certificate } from '@/lib/domain/entities/Certificate';

export default function GraduateDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const studentRepo = getStudentRepository();
    const certRepo = getCertificateRepository();

    const [student, setStudent] = useState<Student | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const studentData = await studentRepo.findById(decodeURIComponent(id));
            if (!studentData) {
                setError('Participante no encontrado');
                return;
            }
            setStudent(studentData);

            // Cargar certificados
            const certs = await certRepo.findByStudentId(studentData.id);
            setCertificates(certs);

        } catch (err: any) {
            console.error(err);
            setError('Error al cargar datos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Cargando perfil del participante...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 text-center">
                <div className="bg-red-50 p-6 rounded-full inline-block mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
                <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la información.'}</p>
                <button 
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <button 
                    onClick={() => router.back()}
                    className="mb-4 text-gray-500 hover:text-primary flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver a la lista
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <span className="bg-primary/10 p-2 rounded-xl text-primary">
                                <User size={32} />
                            </span>
                            {student.firstName} {student.lastName}
                        </h1>
                        <p className="text-gray-500 mt-1 ml-14">Perfil detallado del participante</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => router.push(`/dashboard/graduates/${student.id}/edit`)}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            Editar Participante
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Información Personal</h2>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Matrícula</p>
                                <p className="text-lg font-bold text-gray-900">{student.id}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Cédula</p>
                                <p className="font-medium text-gray-900">{student.cedula || 'No registrada'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Correo Electrónico</p>
                                <p className="font-medium text-gray-900">{student.email || 'No registrado'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                <GraduationCap size={18} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Carrera / Programa</p>
                                <p className="font-medium text-gray-900">{student.career || 'No especificada'}</p>
                            </div>
                        </div>
                        
                         <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Fecha de Registro</p>
                                <p className="text-gray-700">
                                    {student.createdAt.toLocaleDateString('es-DO', { 
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Certificates List */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                     <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Certificados Emitidos</h2>
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                            {certificates.length}
                        </span>
                     </div>
                    
                    {certificates.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                            <Award size={48} className="text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">Este participante no tiene certificados.</p>
                            <button 
                                onClick={() => router.push('/dashboard/certificates/create')}
                                className="mt-4 text-primary text-sm font-bold hover:underline"
                            >
                                Crear uno ahora
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                            {certificates.map((cert) => (
                                <div key={cert.id} className="group p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/certificates/${cert.id}`)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded group-hover:bg-white">
                                            {cert.folio}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                            cert.type === 'PROFUNDO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {cert.type}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">
                                        {cert.academicProgram}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Emitido: {cert.issueDate.toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
