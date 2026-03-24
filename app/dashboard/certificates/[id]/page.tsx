"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Download, 
    Share2, 
    Printer, 
    AlertTriangle,
    CheckCircle, 
    XCircle, 
    Clock, 
    FileText, 
    Calendar, 
    Award,
    QrCode
} from 'lucide-react';
import { getCertificateRepository, getTemplateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';
import { generateCertificatePDF } from '@/lib/application/utils/pdf-generator';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
    getCertificateStatusBadgeClass,
    getCertificateStatusLabel,
    isCertificateBlocked,
} from '@/lib/types/certificateStatus';

export default function CertificateDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  // Unwrap params using React.use() for Next.js 15+
  const { id } = React.use(params) as { id: string };

  const certificateRepository = getCertificateRepository();
  const templateRepository = getTemplateRepository();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdatingRestriction, setIsUpdatingRestriction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restrictionType, setRestrictionType] = useState<'payment' | 'documents' | 'administrative'>('payment');
  const [restrictionReason, setRestrictionReason] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const loadCertificate = async (certificateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateRepository.findById(certificateId);
      
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

  useEffect(() => {
    if (id) {
      void loadCertificate(id);
    }
  }, [id]);

  const handleDownload = async () => {
    if (!certificate) return;
    if (isCertificateBlocked(certificate.status)) {
      toast.error('La descarga esta deshabilitada mientras exista una restriccion activa');
      return;
    }
    setIsDownloading(true);
    
    try {
        if (certificate.pdfUrl) {
            const a = document.createElement('a');
            a.href = `/api/admin/certificates/${encodeURIComponent(certificate.id)}/document`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Documento oficial abierto correctamente");
            return;
        }

        let template = null;
        if (certificate.templateId) {
            template = await templateRepository.findById(certificate.templateId);
        }

        const pdfBlob = await generateCertificatePDF(certificate, template as any);
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

  const handleRestrictionUpdate = async (action: 'block' | 'release') => {
    if (!certificate) return;

    setIsUpdatingRestriction(true);
    try {
      const response = await fetch(`/api/admin/certificates/${encodeURIComponent(certificate.id)}/restriction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          action === 'block'
            ? {
                action,
                type: restrictionType,
                reason: restrictionReason,
              }
            : {
                action,
                reason: releaseReason,
              }
        ),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'No fue posible actualizar la restriccion');
      }

      toast.success(
        action === 'block'
          ? 'Restriccion aplicada correctamente'
          : 'Restriccion liberada correctamente'
      );
      setRestrictionReason('');
      setReleaseReason('');
      await loadCertificate(certificate.id);
    } catch (err) {
      console.error('Error updating restriction:', err);
      toast.error(err instanceof Error ? err.message : 'Error al actualizar la restriccion');
    } finally {
      setIsUpdatingRestriction(false);
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

  const statusClass = getCertificateStatusBadgeClass(certificate.status);
  const statusLabel = getCertificateStatusLabel(certificate.status);
  const restrictionActive = certificate.restriction?.active === true;
  const hasOfficialDocument = Boolean(certificate.pdfUrl && !restrictionActive);
  const canApplyRestriction = !restrictionActive && [
    'verified',
    'pending_signature',
    'signed',
    'issued',
    'available',
    'active',
  ].includes(certificate.status);

  const verificationUrl = `${window.location.origin}/verify/${certificate.folio}`;
  const officialDocumentUrl = `/api/admin/certificates/${encodeURIComponent(certificate.id)}/document`;

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
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading || isCertificateBlocked(certificate.status)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isDownloading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Download size={18} />
                        )}
                        <span className="font-medium hidden sm:inline">
                            {isDownloading ? 'Generando...' : hasOfficialDocument ? 'Descargar PDF oficial' : 'Descargar PDF'}
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
                            {hasOfficialDocument ? 'Documento oficial emitido' : 'Vista previa operativa'}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 capitalize ${statusClass}`}>
                            <CheckCircle size={16} />
                            {statusLabel}
                        </span>
                    </div>

                    {hasOfficialDocument ? (
                        <div className="space-y-4 p-6">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                Esta vista carga el PDF oficial emitido. La descarga interna utiliza el mismo documento persistido para evitar diferencias entre preview y archivo final.
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                <iframe
                                    src={`${officialDocumentUrl}?disposition=inline`}
                                    title={`Documento oficial ${certificate.folio}`}
                                    className="h-[900px] w-full bg-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8">
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                                {restrictionActive
                                    ? 'El documento oficial no se muestra porque el certificado tiene una restriccion activa.'
                                    : 'El PDF oficial aun no existe o no esta accesible. Se muestra una vista operativa de referencia con los datos del certificado.'}
                            </div>

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
                    )}
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-600" />
                        Restriccion administrativa
                    </h3>

                    {restrictionActive ? (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                <p className="font-bold uppercase tracking-wide">
                                    {certificate.restriction?.type === 'payment'
                                        ? 'Bloqueado por pago'
                                        : certificate.restriction?.type === 'documents'
                                            ? 'Bloqueado por documentacion'
                                            : 'Bloqueado administrativamente'}
                                </p>
                                <p className="mt-2">{certificate.restriction?.reason}</p>
                                <p className="mt-3 text-xs text-amber-800/80">
                                    Registrado el{' '}
                                    {certificate.restriction?.blockedAt?.toLocaleString('es-DO')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Motivo de liberacion
                                </label>
                                <textarea
                                    value={releaseReason}
                                    onChange={(event) => setReleaseReason(event.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Detalle opcional del desbloqueo"
                                />
                            </div>

                            <button
                                onClick={() => void handleRestrictionUpdate('release')}
                                disabled={isUpdatingRestriction}
                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                            >
                                {isUpdatingRestriction ? 'Liberando...' : 'Levantar restriccion'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                {canApplyRestriction
                                    ? 'Aplica un bloqueo para suspender disponibilidad publica, descarga del participante y continuidad operativa segun la regla de negocio.'
                                    : `El estado actual (${statusLabel.toLowerCase()}) no admite un bloqueo administrativo desde esta vista.`}
                            </p>

                            {canApplyRestriction && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            Tipo de restriccion
                                        </label>
                                        <select
                                            value={restrictionType}
                                            onChange={(event) =>
                                                setRestrictionType(
                                                    event.target.value as 'payment' | 'documents' | 'administrative'
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="payment">Pago</option>
                                            <option value="documents">Documentacion</option>
                                            <option value="administrative">Administrativa</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            Motivo
                                        </label>
                                        <textarea
                                            value={restrictionReason}
                                            onChange={(event) => setRestrictionReason(event.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Describe por que debe bloquearse este certificado"
                                        />
                                    </div>

                                    <button
                                        onClick={() => void handleRestrictionUpdate('block')}
                                        disabled={isUpdatingRestriction}
                                        className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {isUpdatingRestriction ? 'Aplicando...' : 'Aplicar restriccion'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {isCertificateBlocked(certificate.status) && (
                        <p className="text-xs text-gray-500">
                            Mientras esta restriccion permanezca activa, el participante no podra descargar el documento y la validacion publica reflejara el bloqueo.
                        </p>
                    )}
                </div>
            </div>
 
        </div>
      </div>
    </div>
  );
}
