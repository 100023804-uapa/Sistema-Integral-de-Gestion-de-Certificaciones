"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Download, 
    Share2, 
    Printer, 
    CheckCircle, 
    XCircle, 
    Clock, 
    FileText, 
    Calendar, 
    Award,
    QrCode,
    RefreshCcw,
    AlertTriangle
} from 'lucide-react';
import { getCertificateRepository, getTemplateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';
import { generateCertificatePDF } from '@/lib/application/utils/pdf-generator';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useAlert } from '@/hooks/useAlert';

export default function CertificateDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  // Unwrap params using React.use() for Next.js 15+
  const { id } = React.use(params) as { id: string };

  const certificateRepository = getCertificateRepository();
  const templateRepository = getTemplateRepository();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showConfirm } = useAlert();
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const data = await certificateRepository.findById(id);
        
        if (!data) {
            setError("Certificado no encontrado.");
            return;
        }

        setCertificate(data);
      } catch (err) {
        console.error("Error fetching certificate details:", err);
        setError("Error al cargar los detalles del certificado.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchCertificate();
    }
  }, [id]);

  const handleDownload = async () => {
    if (!certificate) return;
    setIsDownloading(true);
    
    try {
        let template = null;
        if (certificate.templateId) {
            template = await templateRepository.findById(certificate.templateId);
        }

        const pdfBlob = await generateCertificatePDF(certificate, template);
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_${certificate.folio}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Certificado descargado correctamente");
    } catch (err) {
        console.error("Error generating PDF:", err);
        toast.error("Error al generar el PDF");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleRevoke = async () => {
    if (!certificate || certificate.status !== 'active') return;
    const ok = await showConfirm(
        '¿Anular certificado?',
        '¿Estás seguro de que deseas ANULAR este certificado? Esta acción no se puede deshacer y el código QR dejará de ser válido.',
        { type: 'error', confirmText: 'Sí, anular certificado', cancelText: 'No, mantener activo' }
    );
    if (!ok) return;
    
    setIsRevoking(true);
    try {
        await certificateRepository.updateStatus(certificate.id, 'revoked');
        setCertificate({ ...certificate, status: 'revoked' });
        toast.success("Certificado anulado correctamente");
    } catch (err) {
        console.error("Error revoking certificate:", err);
        toast.error("Error al anular el certificado");
    } finally {
        setIsRevoking(false);
    }
  };

  const handleRevokeAndCorrect = async () => {
    if (!certificate || certificate.status !== 'active') return;
    const ok = await showConfirm(
        '¿Anular y corregir?',
        '¿Estás seguro de que deseas ANULAR este certificado y generar uno nuevo? El certificado actual será revocado permanentemente.',
        { type: 'warning', confirmText: 'Anular y proceder', cancelText: 'Cancelar' }
    );
    if (!ok) return;
    
    setIsRevoking(true);
    try {
        await certificateRepository.updateStatus(certificate.id, 'revoked');
        setCertificate({ ...certificate, status: 'revoked' });
        toast.success("Certificado anulado. Redirigiendo a corrección...");
        
        const params = new URLSearchParams({
            studentId: certificate.studentId,
            studentName: certificate.studentName,
            program: certificate.academicProgram,
            type: certificate.type,
        });
        
        router.push(`/dashboard/certificates/create?${params.toString()}`);
    } catch (err) {
        console.error("Error revoking certificate:", err);
        toast.error("Error al iniciar la corrección");
        setIsRevoking(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (error || !certificate) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800">Error</h1>
            <p className="text-gray-600">{error || "No se pudo cargar el certificado."}</p>
            <button 
                onClick={() => router.back()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
                Volver
            </button>
        </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    revoked: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle size={16} />,
    revoked: <XCircle size={16} />,
    expired: <Clock size={16} />
  };

  const verificationUrl = `${window.location.origin}/verify/${certificate.folio}`;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Volver</span>
                </button>
                <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <Printer size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <Share2 size={20} />
                    </button>
                    {certificate.status === 'active' && (
                        <>
                            <button 
                                onClick={handleRevokeAndCorrect}
                                disabled={isRevoking}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <RefreshCcw size={18} />
                                <span className="font-medium hidden sm:inline">Anular y Corregir</span>
                            </button>
                            <button 
                                onClick={handleRevoke}
                                disabled={isRevoking}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <XCircle size={18} />
                                <span className="font-medium hidden md:inline">Anular</span>
                            </button>
                        </>
                    )}
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isDownloading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Download size={18} />
                        )}
                        <span className="font-medium hidden sm:inline">
                            {isDownloading ? 'Generando...' : 'Descargar PDF'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content - Preview */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Vista Previa de Datos
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 capitalize ${statusColors[certificate.status]}`}>
                            {statusIcons[certificate.status]}
                            {certificate.status === 'active' ? 'Activo' : certificate.status === 'revoked' ? 'Revocado' : 'Expirado'}
                        </span>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        {/* Certificate Header Mockup */}
                        <div className="text-center space-y-2 border-b-2 border-primary/10 pb-8">
                            <h3 className="text-2xl font-serif font-bold text-gray-900">CERTIFICADO DE FINALIZACIÓN</h3>
                            <p className="text-gray-500 text-sm uppercase tracking-widest">Se otorga el presente a</p>
                        </div>

                        {/* Student Name */}
                        <div className="text-center py-4">
                            <h1 className="text-4xl font-serif italic text-primary">{certificate.studentName}</h1>
                            {certificate.studentId && <p className="text-gray-400 mt-2 text-sm">ID: {certificate.studentId}</p>}
                        </div>

                        {/* Program Details */}
                        <div className="text-center space-y-4">
                            <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
                                Por haber completado satisfactoriamente los requisitos académicos del programa:
                            </p>
                            <h3 className="text-xl font-bold text-gray-800 uppercase">{certificate.academicProgram}</h3>
                        </div>

                        {/* Dates & Folio */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-100 text-sm gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fecha de Emisión</p>
                                <p className="font-medium text-gray-900">
                                    {certificate.issueDate.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Folio Único</p>
                                <div className="font-mono font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">
                                    {certificate.folio}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Metadata & QR */}
            <div className="space-y-6">
                {/* QR Code Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center space-y-4">
                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                        <QRCodeSVG 
                            value={verificationUrl}
                            size={160}
                            level="H"
                            includeMargin={true}
                            className="w-full h-auto"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Código de Verificación</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Escanea para validar la autenticidad de este documento.
                        </p>
                    </div>
                    <div className="w-full bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-500 break-all border border-gray-100">
                        {verificationUrl}
                    </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Award size={18} className="text-primary" />
                        Detalles Técnicos
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Tipo</span>
                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">{certificate.type}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Creado</span>
                            <span className="font-medium text-gray-900">{certificate.createdAt?.toLocaleDateString()}</span>
                        </div>
                        {certificate.expirationDate && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Vence</span>
                                <span className="font-medium text-red-600">{certificate.expirationDate.toLocaleDateString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">ID Interno</span>
                            <span className="font-mono text-xs text-gray-400">{certificate.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
