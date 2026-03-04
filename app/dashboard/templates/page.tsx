"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, LayoutTemplate, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { getTemplateRepository } from '@/lib/container';
import { CertificateTemplate } from '@/lib/domain/entities/Template';

export default function TemplatesPage() {
  const router = useRouter();
  const repository = getTemplateRepository();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await repository.list(true); // Active only
        setTemplates(data);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("Error al cargar las plantillas.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    
    try {
        await repository.delete(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
        console.error("Error deleting template:", err);
        alert("Error al eliminar la plantilla.");
    }
  };

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">Plantillas</h1>
          <p className="text-gray-500">Diseña y gestiona los formatos de tus certificados.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/templates/create')}
          className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <PlusCircle size={20} /> Nueva Plantilla
        </button>
      </div>

      {/* Grid */}
      {loading ? (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
         </div>
      ) : error ? (
         <div className="text-center text-red-500 py-12">{error}</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center space-y-4">
            <div className="bg-gray-50 p-6 rounded-full inline-block">
                <LayoutTemplate className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No hay plantillas creadas</h3>
            <p className="text-gray-500">Comienza diseñando tu primera plantilla de certificado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
                <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
                    {/* Preview (Background Image) */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {template.backgroundImageUrl ? (
                            <img 
                                src={template.backgroundImageUrl} 
                                alt={template.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <ImageIcon size={40} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button className="p-2 bg-white rounded-full text-gray-800 hover:text-primary transition-colors">
                                <Edit size={20} />
                            </button>
                            <button 
                                onClick={() => handleDelete(template.id)}
                                className="p-2 bg-white rounded-full text-gray-800 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                    {/* Info */}
                    <div className="p-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-900 truncate">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {template.elements.length} elementos configurados
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Actualizado: {template.updatedAt?.toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
