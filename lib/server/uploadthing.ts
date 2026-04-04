import { UTApi, UTFile } from 'uploadthing/server';

const uploadthingToken = process.env.UPLOADTHING_TOKEN;

let sharedUtapi: UTApi | null = null;

function getUtapi(): UTApi {
  if (!uploadthingToken?.trim()) {
    throw new Error('UPLOADTHING_TOKEN no está configurado');
  }

  if (!sharedUtapi) {
    sharedUtapi = new UTApi({ token: uploadthingToken });
  }

  return sharedUtapi;
}

export async function uploadCertificatePdfToUploadThing(
  pdfBuffer: Buffer,
  params: {
    certificateId: string;
    folio: string;
    templateId: string;
  }
): Promise<{ url: string; key: string }> {
  const safeFolio = params.folio.trim() || params.certificateId;
  const fileName = `${safeFolio}-${params.templateId}.pdf`;
  const file = new UTFile([new Uint8Array(pdfBuffer)], fileName, {
    type: 'application/pdf',
    customId: `certificate:${params.certificateId}`,
  });

  const result = await getUtapi().uploadFiles(file, {
    contentDisposition: 'inline',
  });

  if (result.error || !result.data) {
    throw new Error(result.error?.message || 'No fue posible subir el PDF a UploadThing');
  }

  return {
    url: result.data.ufsUrl || result.data.url,
    key: result.data.key,
  };
}
