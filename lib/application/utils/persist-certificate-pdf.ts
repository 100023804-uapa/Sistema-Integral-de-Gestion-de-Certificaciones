export interface PersistedCertificatePdf {
  pdfUrl: string;
  pdfStorageKey?: string | null;
}

export async function persistCertificatePdf(
  certificateId: string,
  pdfBlob: Blob,
  fileName?: string
): Promise<PersistedCertificatePdf> {
  const formData = new FormData();
  const file = new File([pdfBlob], fileName || `${certificateId}.pdf`, {
    type: 'application/pdf',
  });

  formData.append('file', file);

  const response = await fetch(`/api/admin/certificates/${certificateId}/pdf`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { success: false, error: 'Respuesta no valida del servidor.' };

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'No se pudo persistir el PDF del certificado.');
  }

  return {
    pdfUrl: payload.data.pdfUrl,
    pdfStorageKey: payload.data.pdfStorageKey || null,
  };
}
