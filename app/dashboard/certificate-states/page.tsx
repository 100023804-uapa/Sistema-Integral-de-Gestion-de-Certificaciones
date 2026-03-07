"use client";

import { useState, useEffect, type ReactElement } from 'react';
import { CertificateState, StateHistory } from '@/lib/container';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Award, 
  Edit, 
  XCircle,
  ArrowRight,
  History,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATE_CONFIG } from '@/lib/types/certificateState';

export default function CertificateStatesPage() {
  const [states, setStates] = useState<CertificateState[]>([]);
  const [pendingActions, setPendingActions] = useState<CertificateState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<CertificateState | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchStates = async () => {
    try {
      setLoading(true);
      
      // Simular usuario actual - TODO: obtener de auth context
      const currentUserRole = 'coordinator'; // Cambiar según el usuario
      
      // Obtener acciones pendientes
      const pendingResponse = await fetch(`/api/admin/certificate-states/transition?pendingActions=true&userRole=${currentUserRole}`);
      const pendingData = await pendingResponse.json();
      
      if (pendingData.success) {
        setPendingActions(pendingData.data);
      }

    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleTransition = async (certificateId: string, newState: string, comments?: string) => {
    try {
      const response = await fetch('/api/admin/certificate-states/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId,
          newState,
          changedBy: 'current-user-id', // TODO: obtener de auth
          userRole: 'coordinator', // TODO: obtener de auth
          comments
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchStates(); // Refresh
        setSelectedState(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error transitioning state:', error);
      alert('Error al cambiar estado');
    }
  };

  const getStateIcon = (state: string) => {
    const icons: Record<string, ReactElement> = {
      'draft': <Edit size={20} />,
      'pending_review': <Clock size={20} />,
      'verified': <CheckCircle size={20} />,
      'pending_signature': <Shield size={20} />,
      'signed': <Shield size={20} />,
      'issued': <Award size={20} />,
      'cancelled': <XCircle size={20} />
    };
    return icons[state] || <Clock size={20} />;
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'pending_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'verified': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending_signature': 'bg-purple-100 text-purple-800 border-purple-200',
      'signed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'issued': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableTransitions = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/admin/certificate-states/transition?certificateId=${certificateId}&userRole=coordinator`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error getting transitions:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estados de Certificados</h1>
          <p className="text-gray-600">Gestiona el flujo de aprobación de certificados</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Acciones pendientes</option>
            <option value="draft">Borradores</option>
            <option value="pending_review">Esperando revisión</option>
            <option value="verified">Verificados</option>
            <option value="pending_signature">Esperando firma</option>
            <option value="signed">Firmados</option>
            <option value="issued">Emitidos</option>
          </select>
        </div>
      </div>

      {/* Acciones Pendientes */}
      {pendingActions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-500" />
            Acciones Pendientes ({pendingActions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingActions.map((state) => (
              <div
                key={state.id}
                className={cn(
                  "bg-white rounded-lg shadow-md border p-4 hover:shadow-lg transition-shadow cursor-pointer",
                  getStateColor(state.currentState)
                )}
                onClick={() => setSelectedState(state)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStateIcon(state.currentState)}
                    <span className="font-medium">
                      {STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(state.changedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Certificado: {state.certificateId}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {state.comments || 'Sin comentarios'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {states
          .filter(state => filter === 'all' || state.currentState === filter)
          .map((state) => (
          <div
            key={state.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer",
              getStateColor(state.currentState)
            )}
            onClick={() => setSelectedState(state)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {getStateIcon(state.currentState)}
                <h3 className="font-semibold text-lg">
                  {STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedState(state);
                  setShowHistory(true);
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <History size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Certificado:</span>
                <p className="font-medium">{state.certificateId}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Último cambio:</span>
                <p className="text-sm text-gray-600">
                  {new Date(state.changedAt).toLocaleString()}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Cambiado por:</span>
                <p className="text-sm text-gray-600">{state.changedBy}</p>
              </div>

              {state.comments && (
                <div>
                  <span className="text-sm text-gray-500">Comentarios:</span>
                  <p className="text-sm text-gray-600">{state.comments}</p>
                </div>
              )}

              {state.previousState && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Anterior: {STATE_CONFIG[state.previousState as keyof typeof STATE_CONFIG]?.label}</span>
                  <ArrowRight size={12} />
                  <span>Actual: {STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {states.length === 0 && pendingActions.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay estados registrados</h3>
          <p className="text-gray-600">
            Los estados aparecerán aquí cuando se creen certificados
          </p>
        </div>
      )}

      {/* Modal de Transición */}
      {selectedState && !showHistory && (
        <TransitionModal
          state={selectedState}
          onClose={() => setSelectedState(null)}
          onTransition={handleTransition}
        />
      )}

      {/* Modal de Historial */}
      {selectedState && showHistory && (
        <HistoryModal
          certificateId={selectedState.certificateId}
          onClose={() => {
            setShowHistory(false);
            setSelectedState(null);
          }}
        />
      )}
    </div>
  );
}

// Componente de modal de transición
function TransitionModal({ 
  state, 
  onClose, 
  onTransition 
}: { 
  state: CertificateState;
  onClose: () => void;
  onTransition: (certificateId: string, newState: string, comments?: string) => void;
}) {
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<string>('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransitions = async () => {
      try {
        const response = await fetch(`/api/admin/certificate-states/transition?certificateId=${state.certificateId}&userRole=coordinator`);
        const data = await response.json();
        if (data.success) {
          setAvailableTransitions(data.data);
        }
      } catch (error) {
        console.error('Error fetching transitions:', error);
      }
    };

    fetchTransitions();
  }, [state.certificateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransition) return;

    setLoading(true);
    await onTransition(state.certificateId, selectedTransition, comments);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cambiar Estado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Certificado: <span className="font-medium">{state.certificateId}</span>
          </p>
          <p className="text-sm text-gray-600">
            Estado actual: <span className="font-medium">{STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo Estado
            </label>
            <select
              required
              value={selectedTransition}
              onChange={(e) => setSelectedTransition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona un estado</option>
              {availableTransitions.map((transition) => (
                <option key={transition.to} value={transition.to}>
                  {transition.actionLabel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios (opcional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              disabled={loading || !selectedTransition}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Cambiar Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente de modal de historial
function HistoryModal({ 
  certificateId, 
  onClose 
}: { 
  certificateId: string;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<StateHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/admin/certificate-states?certificateId=${certificateId}`);
        const data = await response.json();
        if (data.success) {
          setHistory(data.data);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Historial de Cambios</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Certificado: <span className="font-medium">{certificateId}</span>
          </p>
        </div>

        {history && history.transitions.length > 0 ? (
          <div className="space-y-4">
            {history.transitions.map((transition, index) => (
              <div key={transition.id} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {transition.previousState && (
                      <>
                        <span className="text-sm text-gray-600">
                          {STATE_CONFIG[transition.previousState as keyof typeof STATE_CONFIG]?.label}
                        </span>
                        <ArrowRight size={16} className="text-gray-400" />
                      </>
                    )}
                    <span className="font-medium text-blue-600">
                      {STATE_CONFIG[transition.currentState as keyof typeof STATE_CONFIG]?.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(transition.changedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Por: {transition.changedBy}
                </p>
                {transition.comments && (
                  <p className="text-sm text-gray-500 mt-1 italic">
                    &ldquo;{transition.comments}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay historial de cambios para este certificado
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
