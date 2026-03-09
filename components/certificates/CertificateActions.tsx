'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Share2, Mail, Loader2 } from 'lucide-react';
import { persistCertificatePdf } from '@/lib/application/utils/persist-certificate-pdf';

interface CertificateActionsProps {
  certificate: any; // Using any to handle serialization (Dates becoming strings)
  template?: any;
}

export function CertificateActions({ certificate, template }: CertificateActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
        if (certificate.pdfUrl) {
          window.open(certificate.pdfUrl, '_blank', 'noopener,noreferrer');
          return;
        }

        const { generateCertificatePDF } = await import('@/lib/application/utils/pdf-generator');
        const blob = await generateCertificatePDF(certificate, template || null);

        try {
          const persistedPdf = await persistCertificatePdf(
            certificate.id,
            blob,
            `${certificate.folio}.pdf`
          );
          certificate.pdfUrl = persistedPdf.pdfUrl;
          if (!certificate.metadata) {
            certificate.metadata = {};
          }
          certificate.metadata.pdfStorageKey = persistedPdf.pdfStorageKey || null;
        } catch (persistError) {
          console.error('Error persisting public certificate PDF download:', persistError);
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${certificate.folio}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error("Error creating PDF:", error);
        alert("Error al generar el PDF. Intente nuevamente.");
    } finally {
        setDownloading(false);
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado ${certificate.folio}`,
          text: `Certificado de ${certificate.studentName} - ${certificate.academicProgram}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert("Enlace copiado al portapapeles");
    }
  };

  const handleEmail = async () => {
    const email = prompt("Ingrese el correo electrónico para enviar el certificado:");
    if (!email) return;

    setSendingEmail(true);
    try {
        const { sendCertificateEmail } = await import('@/app/actions/send-email');
        const result = await sendCertificateEmail({
            to: email,
            studentName: certificate.studentName,
            certificateUrl: window.location.href,
            folio: certificate.folio,
        });

        if (result.success) {
            alert(`Correo enviado exitosamente a ${email}`);
        } else {
            alert("Hubo un error al enviar el correo. Por favor intente más tarde.");
            console.error(result.error);
        }
    } catch (error) {
        console.error("Error sending email:", error);
        alert("Error de conexión al enviar el correo.");
    } finally {
        setSendingEmail(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-3 sticky bottom-4 z-10">
      <Button 
        onClick={handleDownload}
        disabled={downloading}
        className="w-full h-12 text-base shadow-lg"
      >
        {downloading ? (
            <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando PDF...
            </>
        ) : (
            <>
                <Download className="mr-2 h-5 w-5" />
                Descargar PDF
            </>
        )}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" className="w-full" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleEmail} disabled={sendingEmail}>
            {sendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Mail className="mr-2 h-4 w-4" />
            )}
            {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
        </Button>
      </div>
    </div>
  );
}
