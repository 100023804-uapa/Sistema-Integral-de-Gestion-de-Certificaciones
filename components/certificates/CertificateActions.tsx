'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Share2, Mail, Loader2 } from 'lucide-react';

interface CertificateActionsProps {
  certificate: any; // Using any to handle serialization (Dates becoming strings)
  pdfGenerator?: any;
  allowShare?: boolean;
  allowEmail?: boolean;
  shareUrl?: string;
  downloadLabel?: string;
  downloadUrl?: string;
  canDownload?: boolean;
  disabledReason?: string;
}

export function CertificateActions({
  certificate,
  allowShare = true,
  allowEmail = true,
  shareUrl,
  downloadLabel = 'Descargar PDF Original',
  downloadUrl,
  canDownload = true,
  disabledReason,
}: CertificateActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!canDownload) {
      alert(disabledReason || 'La descarga no esta disponible en este momento.');
      return;
    }

    setDownloading(true);
    try {
        if (downloadUrl) {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }

        // Implementation will depend on pdf-generator.ts content
        // For now, placeholder or logic to be filled after reading the file
        console.log("Downloading PDF for", certificate.folio);
        
        // Dynamic import to avoid SSR issues if any with jspdf
        const { generateCertificatePDF } = await import('@/lib/application/utils/pdf-generator');
        const blob = await generateCertificatePDF(certificate);
        
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
          url: shareUrl || window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareUrl || window.location.href);
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
            certificateUrl: shareUrl || window.location.href,
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
        disabled={downloading || !canDownload}
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
                {canDownload ? downloadLabel : 'Descarga no disponible'}
            </>
        )}
      </Button>

      {!canDownload && disabledReason && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {disabledReason}
        </p>
      )}

      {(allowShare || allowEmail) && (
        <div className={`grid gap-3 ${allowShare && allowEmail ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {allowShare && (
            <Button variant="secondary" className="w-full" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
          )}
          {allowEmail && (
            <Button variant="secondary" className="w-full" onClick={handleEmail} disabled={sendingEmail}>
                {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Mail className="mr-2 h-4 w-4" />
                )}
                {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
