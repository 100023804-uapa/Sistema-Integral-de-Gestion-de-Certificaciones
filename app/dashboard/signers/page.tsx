"use client";

import { useState, useEffect } from 'react';
import { Signer } from '@/lib/container';
import { Plus, Edit, Trash2, UserCheck, Briefcase, Building, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadButton } from '@/lib/uploadthing';
import { toast } from 'sonner';
import Image from 'next/image';

export default function SignersPage() {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSigner, setEditingSigner] = useState<Signer | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchSigners = async () => {
    try {
      setLoading(true);
      const activeParam = showInactive ? 'false' : 'true'; // Si showInactive es true, activaOnly es false
      const response = await fetch(`/api/admin/signers?activeOnly=${activeParam}`);
      const data = await response.json();
      
      if (data.success) {
        setSigners(data.data);
      } else {
        console.error('Error fetching signers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching signers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSigners();
  }, [showInactive]); // Recargar al cambiar el toggle

  const handleEdit = (signer: Signer) => {
    setEditingSigner(signer);
    setShowForm(true);
  };

  const handleDelete = async (signer: Signer) => {
    if (!confirm(`¿Estás seguro de deshabilitar al firmante "${signer.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/signers/${signer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSigners();
      } else {
        alert('Error al deshabilitar firmante: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting signer:', error);
      alert('Error al deshabilitar firmante');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSigner(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSigner(null);
    fetchSigners();
  };

  if (loading && signers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firmantes Autorizados</h1>
          <p className="text-gray-600">Gestiona las autoridades que pueden firmar certificados</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border rounded-lg shadow-sm">
            <input 
              type="checkbox" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)} 
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Mostrar Inactivos</span>
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Registrar Firmante
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {signers.map((signer) => (
          <div
            key={signer.id}
            className={cn(
              "bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all duration-200 flex flex-col bg-gradient-to-br from-white to-gray-50/50",
              !signer.isActive && "opacity-60 border-dashed"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <UserCheck size={20} />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(signer)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                {signer.isActive && (
                  <button
                    onClick={() => handleDelete(signer)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Deshabilitar"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              {/* Force display of action buttons to not rely entirely on group-hover, since cards don't have group yet */}
              <div className="flex items-center gap-1">
                 <button
                  onClick={() => handleEdit(signer)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                {signer.isActive && (
                  <button
                    onClick={() => handleDelete(signer)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Deshabilitar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{signer.name}</h3>
                <div className="flex items-center gap-1.5 text-primary text-sm mt-1 font-medium">
                  <Briefcase size={14} />
                  <span>{signer.title}</span>
                </div>
              </div>
              
              {signer.department && (
                <div className="flex items-start gap-1.5 text-sm text-gray-600">
                  <Building size={14} className="mt-0.5 shrink-0" />
                  <span className="leading-snug">{signer.department}</span>
                </div>
              )}
              
              {signer.signatureUrl ? (
                <div className="mt-4 pt-3 border-t">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 block">Imagen de Firma</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={signer.signatureUrl} 
                    alt={`Firma de ${signer.name}`} 
                    className="h-12 w-auto object-contain bg-white border border-gray-100 rounded px-2"
                  />
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                    <ImageIcon size={14} />
                    <span>Sin firma digital subida</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
                  signer.isActive
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}
              >
                {signer.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {signers.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-gray-300">
          <UserCheck className="mx-auto text-gray-300 mb-4" size={56} strokeWidth={1.5} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay firmantes registrados</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Registra a las autoridades (ej. Rector, Director) para que puedas seleccionarlos dinámicamente al generar un certificado.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
          >
            <Plus size={20} />
            Registrar Primer Firmante
          </button>
        </div>
      )}

      {showForm && (
        <SignerFormModal
          signer={editingSigner}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Componente de formulario
function SignerFormModal({ 
  signer, 
  onClose, 
  onSuccess 
}: { 
  signer: Signer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: signer?.name || '',
    title: signer?.title || '',
    department: signer?.department || '',
    signatureUrl: signer?.signatureUrl || '',
    isActive: signer?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = signer 
        ? `/api/admin/signers/${signer.id}`
        : '/api/admin/signers';
      
      const method = signer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving signer:', error);
      alert('Error al guardar firmante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <UserCheck className="text-primary" size={24} />
            {signer ? 'Editar Autoridad Firmante' : 'Registrar Autoridad'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-1.5 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="signer-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Dra. Reyna Hiraldo Trejo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cargo / Título Oficial *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Rectora, Coordinadora Académica"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Departamento o Institución <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Centro de Capacitación Profesional CAP"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white"
              />
            </div>

            <div className="pt-2 border-t mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Firma Digitalizada
              </label>
              <p className="text-xs text-gray-500 mb-3">Sube la imagen de la firma (preferiblemente PNG con fondo transparente).</p>
              
              <div className="flex flex-col gap-4">
                {!formData.signatureUrl ? (
                  <UploadButton
                    endpoint="signatureUpload"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setFormData({ ...formData, signatureUrl: res[0].url });
                        toast.success('Firma subida correctamente');
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Error al subir: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-primary text-white hover:bg-primary/90 transition-colors w-full h-11 text-sm font-semibold shadow-sm rounded-lg",
                      allowedContent: "hidden"
                    }}
                    content={{
                      button({ ready }) {
                        if (ready) return "Subir Imagen de Firma";
                        return "Iniciando...";
                      }
                    }}
                  />
                ) : (
                  <div className="relative p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center group">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-white border rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Quitar imagen"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Vista Previa</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formData.signatureUrl} 
                      alt="Firma del autor" 
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}

                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100"></span>
                  </div>
                  <span className="relative px-2 bg-white text-[10px] text-gray-400 uppercase tracking-widest">O URL Manual</span>
                </div>

                <input
                  type="url"
                  placeholder="https://o pega la URL aquí..."
                  value={formData.signatureUrl}
                  onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-white text-xs font-mono"
                />
              </div>
            </div>

            {signer && (
              <div className="flex items-center pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                  <span className="ml-2 block text-sm font-medium text-gray-700">
                    Firmante Activo
                  </span>
                </label>
              </div>
            )}
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="signer-form"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium shadow-sm flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              signer ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
