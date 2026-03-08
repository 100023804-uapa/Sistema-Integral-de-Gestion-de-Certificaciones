"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle,
  Clock,
  Download,
  Printer,
  RefreshCcw,
  Share2,
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { getCertificateRepository, getTemplateRepository } from '@/lib/container';
import { Certificate } from '@/lib/domain/entities/Certificate';
import { generateCertificatePDF } from '@/lib/application/utils/pdf-generator';
import {
  RenderedCertificateTemplate,
  renderCertificateTemplate,
} from '@/lib/application/utils/certificate-template-renderer';
import { useAlert } from '@/hooks/useAlert';

export default function CertificateDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  const { id } = React.use(params) as { id: string };
  const { showConfirm } = useAlert();

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [renderedTemplate, setRenderedTemplate] = useState<RenderedCertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRenderingTemplate, setIsRenderingTemplate] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const certificateRepository = getCertificateRepository();
        const templateRepository = getTemplateRepository();
        const data = await certificateRepository.findById(id);

        if (!data) {
          setError('Certificado no encontrado.');
          return;
        }

        setCertificate(data);

        if (data.templateId) {
          try {
            const templateData = await templateRepository.findById(data.templateId);
            if (templateData) {
              setTemplate(templateData);
              setTemplateName(templateData.name);
            } else {
              setTemplate(null);
              setTemplateName(null);
            }
          } catch (templateError) {
            console.error('Error fetching template data:', templateError);
            setTemplate(null);
            setTemplateName(null);
          }
        } else {
          setTemplate(null);
          setTemplateName(null);
        }
      } catch (fetchError) {
        console.error('Error fetching certificate details:', fetchError);
        setError('Error al cargar los detalles del certificado.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCertificate();
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const renderSelectedTemplate = async () => {
      if (!certificate) {
        setRenderedTemplate(null);
        return;
      }

      setIsRenderingTemplate(true);

      try {
        const rendered = await renderCertificateTemplate(template, certificate, {
          verificationUrl:
            certificate.qrCodeUrl ||
            `${window.location.origin}/verify/${certificate.publicVerificationCode || certificate.folio}`,
        });

        if (!cancelled) {
          setRenderedTemplate(rendered);
        }
      } catch (renderError) {
        console.error('Error rendering certificate template:', renderError);
        if (!cancelled) {
          setRenderedTemplate(null);
        }
      } finally {
        if (!cancelled) {
          setIsRenderingTemplate(false);
        }
      }
    };

    renderSelectedTemplate();

    return () => {
      cancelled = true;
    };
  }, [certificate, template]);

  useEffect(() => {
    if (!renderedTemplate) {
      setPreviewScale(1);
      return;
    }

    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const availableWidth = Math.max(viewport.clientWidth - 24, 320);
      const widthPx = renderedTemplate.width * 3.7795275591;
      const widthScale = availableWidth / widthPx;
      const nextScale = Math.min(widthScale, 1.45);

      if (Number.isFinite(nextScale) && nextScale > 0) {
        setPreviewScale(nextScale);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(viewport);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [renderedTemplate]);

  const handleDownload = async () => {
    if (!certificate) return;
    setIsDownloading(true);

    try {
      const templateRepository = getTemplateRepository();
      const selectedTemplate = certificate.templateId
        ? await templateRepository.findById(certificate.templateId)
        : null;

      const pdfBlob = await generateCertificatePDF(certificate, selectedTemplate);
      const url = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Certificado_${certificate.folio}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);

      toast.success('Certificado descargado correctamente');
    } catch (downloadError) {
      console.error('Error generating PDF:', downloadError);
      toast.error('Error al generar el PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRevoke = async () => {
    if (!certificate || certificate.status !== 'active') return;

    const confirmed = await showConfirm(
      '¿Anular certificado?',
      '¿Estás seguro de que deseas anular este certificado? Esta acción no se puede deshacer y el código QR dejará de ser válido.',
      {
        type: 'error',
        confirmText: 'Sí, anular certificado',
        cancelText: 'No, mantener activo',
      }
    );

    if (!confirmed) return;

    setIsRevoking(true);
    try {
      const certificateRepository = getCertificateRepository();
      await certificateRepository.updateStatus(certificate.id, 'revoked');
      setCertificate({ ...certificate, status: 'revoked' });
      toast.success('Certificado anulado correctamente');
    } catch (revokeError) {
      console.error('Error revoking certificate:', revokeError);
      toast.error('Error al anular el certificado');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeAndCorrect = async () => {
    if (!certificate || certificate.status !== 'active') return;

    const confirmed = await showConfirm(
      '¿Anular y corregir?',
      '¿Estás seguro de que deseas anular este certificado y generar uno nuevo? El certificado actual será revocado permanentemente.',
      {
        type: 'warning',
        confirmText: 'Anular y proceder',
        cancelText: 'Cancelar',
      }
    );

    if (!confirmed) return;

    setIsRevoking(true);
    try {
      const certificateRepository = getCertificateRepository();
      await certificateRepository.updateStatus(certificate.id, 'revoked');
      setCertificate({ ...certificate, status: 'revoked' });
      toast.success('Certificado anulado. Redirigiendo a corrección...');

      const query = new URLSearchParams({
        studentId: certificate.studentId,
        studentName: certificate.studentName,
        program: certificate.academicProgram,
        type: certificate.type,
      });

      router.push(`/dashboard/certificates/create?${query.toString()}`);
    } catch (revokeError) {
      console.error('Error revoking certificate:', revokeError);
      toast.error('Error al iniciar la corrección');
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
        <p className="text-gray-600">{error || 'No se pudo cargar el certificado.'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  const verificationUrl =
    certificate.qrCodeUrl ||
    `${window.location.origin}/verify/${certificate.publicVerificationCode || certificate.folio}`;
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    revoked: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle size={16} />,
    revoked: <XCircle size={16} />,
    expired: <Clock size={16} />,
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vista de Diseño</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Plantilla seleccionada renderizada con los datos reales del certificado.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 capitalize ${statusColors[certificate.status]}`}
                >
                  {statusIcons[certificate.status]}
                  {certificate.status === 'active'
                    ? 'Activo'
                    : certificate.status === 'revoked'
                      ? 'Revocado'
                      : 'Expirado'}
                </span>
              </div>

              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-blue-700 text-xs">
                <AlertTriangle size={14} className="text-blue-500" />
                <span>
                  La firma, el código QR y el resto de variables visibles aquí salen del mismo render que usa la
                  descarga PDF.
                </span>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                <div
                  ref={previewViewportRef}
                  className="relative mx-auto bg-slate-100/90 shadow-inner rounded-[28px] overflow-y-auto overflow-x-hidden flex items-start justify-center p-2 sm:p-3 lg:p-4 border border-slate-200 min-h-[82vh] lg:min-h-[86vh]"
                >
                  {isRenderingTemplate ? (
                    <div className="text-center space-y-3 text-gray-500 my-auto">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p>Renderizando plantilla seleccionada...</p>
                    </div>
                  ) : renderedTemplate ? (
                    <div
                      className="bg-white shadow-[0_28px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 rounded-sm"
                      style={{
                        width: `${renderedTemplate.width}mm`,
                        height: `${renderedTemplate.height}mm`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top center',
                        overflow: 'hidden',
                        marginTop: '8px',
                        marginBottom: '32px',
                      }}
                    >
                      <iframe
                        title="Vista de diseño del certificado"
                        srcDoc={renderedTemplate.documentHtml}
                        className="w-full h-full border-0 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 my-auto">
                      <Award className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-gray-400">No se pudo renderizar la plantilla seleccionada.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {templateName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Plantilla</span>
                    <span className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded text-[10px] uppercase">
                      {templateName}
                    </span>
                  </div>
                )}
                {renderedTemplate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Motor de render</span>
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700 uppercase text-[10px]">
                      {renderedTemplate.mode === 'html'
                        ? 'HTML'
                        : renderedTemplate.mode === 'legacy'
                          ? 'LEGACY'
                          : 'DEFAULT'}
                    </span>
                  </div>
                )}
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
