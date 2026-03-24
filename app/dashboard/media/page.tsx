"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Trash2, Copy, Image as ImageIcon, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadButton } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { useAlert } from '@/hooks/useAlert';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  key: string;
  createdAt?: any;
}

export default function MediaCenterPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { showConfirm, showAlert } = useAlert();

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'media_files'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const mediaFiles: MediaFile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        mediaFiles.push({
          id: doc.id,
          name: data.name,
          url: data.url,
          key: data.key,
          createdAt: data.createdAt,
        });
      });
      setFiles(mediaFiles);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Error al cargar la biblioteca de medios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadComplete = async (res: any) => {
    try {
      // res is an array of uploaded files from UploadThing
      for (const file of res) {
        await addDoc(collection(db, 'media_files'), {
          name: file.name,
          url: file.url,
          key: file.key,
          createdAt: serverTimestamp(),
        });
      }
      toast.success('Imagen subida correctamente');
      fetchMedia();
    } catch (error) {
      console.error('Error saving media to firestore:', error);
      toast.error('La imagen se subió pero no se pudo registrar en la biblioteca.');
    }
  };

  const handleDelete = async (file: MediaFile) => {
    const ok = await showConfirm(
      '¿Eliminar imagen?',
      `¿Estás seguro de que deseas eliminar "${file.name}" de la biblioteca? Esta acción no se puede deshacer y romperá cualquier plantilla que esté usando esta imagen.`,
      { type: 'error', confirmText: 'Eliminar permanentemente', cancelText: 'Conservar imagen' }
    );

    if (!ok) return;

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'media_files', file.id));
      
      // Note: We should also delete from UploadThing using an API call/server action,
      // but for simplicity in this migration step, we at least remove it from our active index.
      // Definitively, we should use a server action with utapi.deleteFiles(file.key)
      
      setFiles(files.filter(f => f.id !== file.id));
      toast.success('Referencia eliminada de la biblioteca');
    } catch (error) {
      console.error('Error deleting file:', error);
      showAlert('Error', 'No se pudo eliminar el archivo de la biblioteca.', 'error');
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast.success('URL copiada al portapapeles');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Medios</h1>
          <p className="text-gray-600">Sube logos institucionales o sellos para tus plantillas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <UploadButton
            endpoint="mediaUpload"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.error(`Error: ${error.message}`);
            }}
            appearance={{
              button: "bg-primary text-white hover:bg-primary/90 transition-colors shadow-md font-semibold px-6 py-3 rounded-lg h-auto min-w-[160px]",
              allowedContent: "hidden"
            }}
            content={{
              button({ ready }) {
                if (ready) return "Subir Nueva Imagen";
                return "Preparando...";
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="text-primary" size={20} />
          Imágenes Alojadas
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="h-8 w-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>Cargando biblioteca de medios...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <ImageIcon className="mx-auto text-gray-300 mb-4" size={56} strokeWidth={1.5} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes imágenes en tu biblioteca</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Las imágenes que subas aparecerán aquí. Copia el enlace (URL) para utilizarlo en tus plantillas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => (
              <div key={file.id} className="group flex flex-col bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-100 flex items-center justify-center p-4 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="p-2.5 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-sm relative group/btn"
                      title="Copiar URL"
                    >
                      {copiedUrl === file.url ? (
                        <CheckCircle2 size={18} className="text-green-600" />
                      ) : (
                        <LinkIcon size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2.5 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                      title="Eliminar de Biblioteca"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 border-t bg-gray-50 flex flex-col justify-between flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate mb-2" title={file.name}>
                    {file.name}
                  </p>
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className={cn(
                      "flex items-center justify-center gap-2 text-xs py-1.5 px-3 rounded border transition-all w-full select-none",
                      copiedUrl === file.url 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {copiedUrl === file.url ? (
                      <>
                        <CheckCircle2 size={14} />
                        ¡URL Copiada!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copiar URL (src)
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
