"use client";

import { useState, useEffect } from 'react';
import { AcademicProgram } from '@/lib/container';
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check, Clock, AlertCircle
} from 'lucide-react';

// ─────────────────────────────────────────────
// Tipos internos del formulario
// ─────────────────────────────────────────────
interface ProgramForm {
  name: string;
  code: string;
  description: string;
  durationHours: string;
  isActive: boolean;
}

const emptyForm: ProgramForm = { name: '', code: '', description: '', durationHours: '', isActive: true };

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export default function ProgramsPage() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal estado
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AcademicProgram | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirmación de borrado
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Carga inicial
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/academic-programs');
      const data = await res.json();
      if (data.success) setPrograms(data.data);
    } catch (e) {
      console.error('Error cargando programas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);

  // ── Filtrado
  const filtered = programs
    .filter(p => {
      if (filterActive === 'active') return p.isActive;
      if (filterActive === 'inactive') return !p.isActive;
      return true;
    })
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    );

  // ── Abrir modal de creación
  const openCreate = () => {
    setEditingProgram(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  // ── Abrir modal de edición
  const openEdit = (p: AcademicProgram) => {
    setEditingProgram(p);
    setForm({
      name: p.name,
      code: p.code,
      description: p.description || '',
      durationHours: p.durationHours?.toString() || '',
      isActive: p.isActive ?? true,
    });
    setFormError('');
    setShowModal(true);
  };

  // ── Guardar (crear o editar)
  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Nombre y Código son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        durationHours: form.durationHours ? Number(form.durationHours) : undefined,
        isActive: form.isActive,
        ...(editingProgram ? { id: editingProgram.id } : {}),
      };

      const res = await fetch('/api/admin/academic-programs', {
        method: editingProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setShowModal(false);
      await fetchPrograms();
    } catch (e: any) {
      setFormError(e.message || 'Error al guardar el programa.');
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar (soft delete)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/academic-programs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDeletingId(null);
      await fetchPrograms();
    } catch (e) {
      console.error('Error eliminando programa:', e);
    }
  };

  // ── Estadísticas rápidas
  const totalActive = programs.filter(p => p.isActive).length;
  const totalInactive = programs.filter(p => !p.isActive).length;

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={26} className="text-primary" />
            Programas Académicos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Catálogo de programas disponibles para emitir certificados.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo Programa
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{programs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          <p className="text-xs text-gray-500 mt-1">Activos</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{totalInactive}</p>
          <p className="text-xs text-gray-500 mt-1">Inactivos</p>
        </div>
      </div>

      {/* Controles de búsqueda y filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === f
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de programas */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm">Cargando programas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {search || filterActive !== 'all'
                ? 'No hay programas que coincidan con los filtros.'
                : 'No hay programas registrados. ¡Crea el primero!'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Duración</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                      {p.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                    {p.description || <span className="text-gray-300 italic">Sin descripción</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {p.durationHours ? (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {p.durationHours} h
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.isActive ? <><Check size={11} /> Activo</> : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      {deletingId === p.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Confirmar"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                            title="Cancelar"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">
                {editingProgram ? 'Editar Programa' : 'Nuevo Programa Académico'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Programa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Gestión de Proyectos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: GP-01"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Describe brevemente el programa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (horas) <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  value={form.durationHours}
                  onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: 40"
                  min={1}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Programa Activo
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingProgram ? 'Guardar Cambios' : 'Crear Programa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
