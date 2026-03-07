"use client";

import { useState, useEffect } from 'react';
import { AcademicArea, Campus } from '@/lib/container';
import { Plus, Edit, Trash2, Building, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AcademicAreasPage() {
  const [academicAreas, setAcademicAreas] = useState<AcademicArea[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAcademicArea, setEditingAcademicArea] = useState<AcademicArea | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch academic areas
      const academicAreasResponse = await fetch('/api/admin/academic-areas');
      const academicAreasData = await academicAreasResponse.json();
      
      if (academicAreasData.success) {
        setAcademicAreas(academicAreasData.data);
      } else {
        console.error('Error fetching academic areas:', academicAreasData.error);
      }

      // Fetch campuses for filter and form
      const campusesResponse = await fetch('/api/admin/campuses?activeOnly=true');
      const campusesData = await campusesResponse.json();
      
      if (campusesData.success) {
        setCampuses(campusesData.data);
      } else {
        console.error('Error fetching campuses:', campusesData.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Fetch filtered academic areas when campus is selected
    if (selectedCampus) {
      fetchFilteredAcademicAreas();
    } else {
      fetchData();
    }
  }, [selectedCampus]);

  const fetchFilteredAcademicAreas = async () => {
    try {
      const url = selectedCampus 
        ? `/api/admin/academic-areas?campusId=${selectedCampus}`
        : '/api/admin/academic-areas';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAcademicAreas(data.data);
      }
    } catch (error) {
      console.error('Error fetching filtered academic areas:', error);
    }
  };

  const handleEdit = (academicArea: AcademicArea) => {
    setEditingAcademicArea(academicArea);
    setShowForm(true);
  };

  const handleDelete = async (academicArea: AcademicArea) => {
    if (!confirm(`¿Estás seguro de eliminar el área académica "${academicArea.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/academic-areas/${academicArea.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchFilteredAcademicAreas();
      } else {
        alert('Error al eliminar área académica: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting academic area:', error);
      alert('Error al eliminar área académica');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAcademicArea(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAcademicArea(null);
    fetchFilteredAcademicAreas();
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus ? campus.name : 'Recinto desconocido';
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Áreas Académicas</h1>
          <p className="text-gray-600">Gestiona las áreas académicas por recinto</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nueva Área
        </button>
      </div>

      {/* Campus Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Recinto
        </label>
        <div className="flex items-center gap-4">
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos los recintos</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          {selectedCampus && (
            <button
              onClick={() => setSelectedCampus('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academicAreas.map((academicArea) => (
          <div
            key={academicArea.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow",
              !academicArea.isActive && "opacity-60"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Building className="text-primary" size={20} />
                <h3 className="font-semibold text-lg">{academicArea.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(academicArea)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(academicArea)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Código:</span>
                <p className="font-medium">{academicArea.code}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Recinto:</span>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  {getCampusName(academicArea.campusId)}
                </div>
              </div>
              
              {academicArea.description && (
                <div>
                  <span className="text-sm text-gray-500">Descripción:</span>
                  <p className="text-sm text-gray-600">{academicArea.description}</p>
                </div>
              )}

              <div className="pt-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    academicArea.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {academicArea.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {academicAreas.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedCampus ? 'No hay áreas académicas en este recinto' : 'No hay áreas académicas'}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCampus 
              ? 'Agrega áreas académicas para este recinto'
              : 'Comienza agregando tu primera área académica'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Agregar Área
          </button>
        </div>
      )}

      {showForm && (
        <AcademicAreaForm
          academicArea={editingAcademicArea}
          campuses={campuses}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Componente de formulario
function AcademicAreaForm({ 
  academicArea, 
  campuses,
  onClose, 
  onSuccess 
}: { 
  academicArea: AcademicArea | null;
  campuses: Campus[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: academicArea?.name || '',
    code: academicArea?.code || '',
    description: academicArea?.description || '',
    campusId: academicArea?.campusId || '',
    isActive: academicArea?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = academicArea 
        ? `/api/admin/academic-areas/${academicArea.id}`
        : '/api/admin/academic-areas';
      
      const method = academicArea ? 'PUT' : 'POST';
      
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
      console.error('Error saving academic area:', error);
      alert('Error al guardar área académica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {academicArea ? 'Editar Área Académica' : 'Nueva Área Académica'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recinto *
            </label>
            <select
              required
              value={formData.campusId}
              onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecciona un recinto</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name} ({campus.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (academicArea ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
