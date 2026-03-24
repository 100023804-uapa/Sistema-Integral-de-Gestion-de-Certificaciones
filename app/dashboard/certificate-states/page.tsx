"use client";

import React, { useState, useEffect } from 'react';
import { CertificateState, StateHistory } from '@/lib/container';
import { useAuth } from '@/lib/contexts/AuthContext';
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
  Filter,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATE_CONFIG, StateTransition } from '@/lib/types/certificateState';

type SignerCandidate = {
  uid: string;
  displayName: string;
  email: string;
  roleCode: string;
};

type TemplateCandidate = {
  id: string;
  name: string;
  description?: string;
};

type TransitionExecutionRequest = {
  certificateId: string;
  newState: string;
  comments?: string;
  signerId?: string;
  templateId?: string;
};

function getCertificateLabel(state: CertificateState) {
  return (state.metadata?.folio as string) || state.certificateId;
}

function intersectTransitions(transitionGroups: StateTransition[][]): StateTransition[] {
  if (transitionGroups.length === 0) {
    return [];
  }

  const [firstGroup, ...restGroups] = transitionGroups;
  return firstGroup.filter((transition) =>
    restGroups.every((group) => group.some((candidate) => candidate.to === transition.to))
  );
}

export default function CertificateStatesPage() {
  const { user } = useAuth();
  const [states, setStates] = useState<CertificateState[]>([]);
  const [pendingActions, setPendingActions] = useState<CertificateState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<CertificateState | null>(null);
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBulkTransition, setShowBulkTransition] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchStates = async () => {
    try {
      setLoading(true);
      const [pendingResponse, statesResponse] = await Promise.all([
        fetch('/api/admin/certificate-states/transition?pendingActions=true'),
        fetch('/api/admin/certificate-states?userId=self'),
      ]);

      const pendingData = await pendingResponse.json();
      const statesData = await statesResponse.json();

      if (pendingData.success) {
        setPendingActions(pendingData.data);
      }

      if (statesData.success) {
        setStates(statesData.data);
      }

    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void fetchStates();
  }, [user]);

  useEffect(() => {
    const validIds = new Set(states.map((state) => state.certificateId));
    setSelectedCertificateIds((current) => current.filter((certificateId) => validIds.has(certificateId)));
  }, [states]);

  const executeTransitionAction = async ({
    certificateId,
    newState,
    comments,
    signerId,
    templateId,
  }: TransitionExecutionRequest) => {
    if (newState === 'pending_signature') {
      if (!signerId) {
        throw new Error('Selecciona un firmante para continuar.');
      }

      const response = await fetch('/api/admin/digital-signatures/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId,
          requestedTo: signerId,
          message: comments || undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No fue posible solicitar la firma');
      }

      return;
    }

    if (newState === 'issued') {
      if (!templateId) {
        throw new Error('Selecciona una plantilla activa para emitir el certificado.');
      }

      const response = await fetch('/api/admin/certificate-templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId,
          templateId,
          includeQR: true,
          includeSignature: true,
          watermark: false,
          quality: 'medium',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No fue posible emitir el certificado');
      }

      return;
    }

    const response = await fetch('/api/admin/certificate-states/transition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        certificateId,
        newState,
        comments,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'No fue posible cambiar el estado');
    }
  };

  const refreshStatesAndCloseModals = async () => {
    await fetchStates();
    setSelectedState(null);
    setShowBulkTransition(false);
    setSelectedCertificateIds([]);
  };

  const handleTransition = async (certificateId: string, newState: string, comments?: string) => {
    try {
      await executeTransitionAction({
        certificateId,
        newState,
        comments,
      });
      await refreshStatesAndCloseModals();
    } catch (error) {
      console.error('Error transitioning state:', error);
      alert(error instanceof Error ? error.message : 'Error al cambiar estado');
    }
  };

  const filteredStates = states.filter((state) =>
    filter === 'all'
      ? true
      : filter === 'pending'
        ? ['pending_review', 'pending_signature'].includes(state.currentState)
        : state.currentState === filter
  );

  const visibleCertificateIds = filteredStates.map((state) => state.certificateId);
  const selectedStates = states.filter((state) => selectedCertificateIds.includes(state.certificateId));
  const allVisibleSelected =
    visibleCertificateIds.length > 0 &&
    visibleCertificateIds.every((certificateId) => selectedCertificateIds.includes(certificateId));
  const selectedVisibleCount = visibleCertificateIds.filter((certificateId) =>
    selectedCertificateIds.includes(certificateId)
  ).length;

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificateIds((current) =>
      current.includes(certificateId)
        ? current.filter((id) => id !== certificateId)
        : [...current, certificateId]
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedCertificateIds((current) => {
      if (allVisibleSelected) {
        return current.filter((certificateId) => !visibleCertificateIds.includes(certificateId));
      }

      return Array.from(new Set([...current, ...visibleCertificateIds]));
    });
  };

  const getStateIcon = (state: string) => {
    const icons: Record<string, React.ReactNode> = {
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
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Selección operativa
            </p>
            <p className="text-sm text-gray-600">
              Selecciona todos los visibles o solo algunos para ejecutar una acción en lote.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              disabled={visibleCertificateIds.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCertificateIds([])}
              disabled={selectedCertificateIds.length === 0}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar selección
            </button>
            <button
              type="button"
              onClick={() => setShowBulkTransition(true)}
              disabled={selectedStates.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cambiar estado ({selectedStates.length})
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {selectedStates.length > 0
            ? `${selectedStates.length} certificados seleccionados. ${selectedVisibleCount} pertenecen al filtro visible actual.`
            : 'No hay certificados seleccionados aún.'}
        </p>
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
                  <p className="font-medium">
                    Certificado: {getCertificateLabel(state)}
                  </p>
                  {state.metadata?.studentName && (
                    <p className="text-xs text-gray-600">
                      Participante: {String(state.metadata.studentName)}
                    </p>
                  )}
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
        {filteredStates.map((state) => {
          const isSelected = selectedCertificateIds.includes(state.certificateId);
          return (
          <div
            key={state.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer",
              isSelected && 'ring-2 ring-primary ring-offset-2',
              getStateColor(state.currentState)
            )}
            onClick={() => setSelectedState(state)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCertificateSelection(state.certificateId);
                  }}
                  className="mt-0.5 text-primary hover:text-primary/80"
                  aria-label={isSelected ? 'Quitar de la selección' : 'Agregar a la selección'}
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="flex items-center gap-2">
                  {getStateIcon(state.currentState)}
                  <h3 className="font-semibold text-lg">
                    {STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label}
                  </h3>
                </div>
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
                <p className="font-medium">
                  {getCertificateLabel(state)}
                </p>
                {state.metadata?.studentName && (
                  <p className="text-xs text-gray-600">
                    {String(state.metadata.studentName)}
                  </p>
                )}
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
        )})}
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
          onExecuteAction={executeTransitionAction}
          onCompleted={refreshStatesAndCloseModals}
        />
      )}

      {showBulkTransition && selectedStates.length > 0 && (
        <BulkTransitionModal
          states={selectedStates}
          onClose={() => setShowBulkTransition(false)}
          onExecuteAction={executeTransitionAction}
          onCompleted={refreshStatesAndCloseModals}
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
  onTransition,
  onExecuteAction,
  onCompleted,
}: { 
  state: CertificateState;
  onClose: () => void;
  onTransition: (certificateId: string, newState: string, comments?: string) => Promise<void>;
  onExecuteAction: (params: TransitionExecutionRequest) => Promise<void>;
  onCompleted: () => Promise<void>;
}) {
  const [availableTransitions, setAvailableTransitions] = useState<StateTransition[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<string>('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTransitions, setLoadingTransitions] = useState(true);
  const [signers, setSigners] = useState<SignerCandidate[]>([]);
  const [templates, setTemplates] = useState<TemplateCandidate[]>([]);
  const [selectedSigner, setSelectedSigner] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const certificateLabel = getCertificateLabel(state);
  const currentStateLabel =
    STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label || state.currentState;
  const hasAvailableTransitions = availableTransitions.length > 0;
  const noTransitionMessage =
    state.currentState === 'issued'
      ? 'El certificado ya fue emitido y no tiene cambios manuales disponibles para tu rol desde este módulo. Si necesitas afectar su disponibilidad usa las restricciones del certificado o solicita a un administrador la cancelación.'
      : state.currentState === 'cancelled'
        ? 'El certificado ya está cancelado y no admite nuevos cambios en este flujo.'
        : 'No hay transiciones manuales disponibles para el estado actual y tu rol.';

  useEffect(() => {
    const fetchModalData = async () => {
      try {
        setLoadingTransitions(true);
        const [transitionResponse, signerResponse, templateResponse] = await Promise.all([
          fetch(`/api/admin/certificate-states/transition?certificateId=${state.certificateId}`),
          fetch('/api/admin/internal-users/signers'),
          fetch('/api/admin/certificate-templates?activeOnly=true'),
        ]);

        const transitionData = await transitionResponse.json();
        const signerData = await signerResponse.json();
        const templateData = await templateResponse.json();

        if (transitionData.success) {
          setAvailableTransitions(transitionData.data);
        }

        if (signerData.success) {
          setSigners(signerData.data);
        }

        if (templateData.success) {
          setTemplates(templateData.data);
        }
      } catch (error) {
        console.error('Error fetching transition modal data:', error);
      } finally {
        setLoadingTransitions(false);
      }
    };

    void fetchModalData();
  }, [state.certificateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransition) return;

    setLoading(true);
    try {
      if (selectedTransition === 'pending_signature' && !selectedSigner) {
        alert('Selecciona un firmante para continuar.');
        return;
      }

      if (selectedTransition === 'issued' && !selectedTemplate) {
        alert('Selecciona una plantilla activa para emitir el certificado.');
        return;
      }

      if (selectedTransition === 'pending_signature' || selectedTransition === 'issued') {
        await onExecuteAction({
          certificateId: state.certificateId,
          newState: selectedTransition,
          comments,
          signerId: selectedSigner || undefined,
          templateId: selectedTemplate || undefined,
        });
        await onCompleted();
        return;
      }

      await onTransition(state.certificateId, selectedTransition, comments);
    } catch (error) {
      console.error('Error executing transition flow:', error);
      alert(error instanceof Error ? error.message : 'No fue posible completar la acción');
    } finally {
      setLoading(false);
    }
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
            Certificado: <span className="font-medium">{certificateLabel}</span>
          </p>
          <p className="text-sm text-gray-600">
            Estado actual: <span className="font-medium">{currentStateLabel}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingTransitions ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Cargando acciones disponibles...
            </div>
          ) : hasAvailableTransitions ? (
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
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>{noTransitionMessage}</p>
              </div>
            </div>
          )}

          {hasAvailableTransitions && selectedTransition === 'pending_signature' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firmante asignado
              </label>
              <select
                required
                value={selectedSigner}
                onChange={(e) => setSelectedSigner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona un firmante</option>
                {signers.map((signer) => (
                  <option key={signer.uid} value={signer.uid}>
                    {signer.displayName} ({signer.roleCode})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Se creará la solicitud de firma y se notificará al firmante.
              </p>
            </div>
          )}

          {hasAvailableTransitions && selectedTransition === 'issued' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plantilla para emisión
              </label>
              <select
                required
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona una plantilla</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                La emisión genera el PDF final, persiste el archivo y marca el certificado como emitido.
              </p>
            </div>
          )}

          {hasAvailableTransitions && (
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
          )}

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
              disabled={loading || loadingTransitions || !selectedTransition || !hasAvailableTransitions}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : hasAvailableTransitions ? 'Cambiar Estado' : 'Sin acciones'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkTransitionModal({
  states,
  onClose,
  onExecuteAction,
  onCompleted,
}: {
  states: CertificateState[];
  onClose: () => void;
  onExecuteAction: (params: TransitionExecutionRequest) => Promise<void>;
  onCompleted: () => Promise<void>;
}) {
  const [availableTransitions, setAvailableTransitions] = useState<StateTransition[]>([]);
  const [selectedTransition, setSelectedTransition] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTransitions, setLoadingTransitions] = useState(true);
  const [signers, setSigners] = useState<SignerCandidate[]>([]);
  const [templates, setTemplates] = useState<TemplateCandidate[]>([]);
  const [selectedSigner, setSelectedSigner] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const distinctStateLabels = Array.from(
    new Set(
      states.map(
        (state) =>
          STATE_CONFIG[state.currentState as keyof typeof STATE_CONFIG]?.label || state.currentState
      )
    )
  );
  const certificatePreview = states
    .slice(0, 3)
    .map((state) => getCertificateLabel(state))
    .join(', ');
  const remainingCount = states.length - Math.min(states.length, 3);
  const hasAvailableTransitions = availableTransitions.length > 0;

  useEffect(() => {
    const fetchModalData = async () => {
      try {
        setLoadingTransitions(true);
        const [transitionResponses, signerResponse, templateResponse] = await Promise.all([
          Promise.all(
            states.map((state) =>
              fetch(`/api/admin/certificate-states/transition?certificateId=${state.certificateId}`)
            )
          ),
          fetch('/api/admin/internal-users/signers'),
          fetch('/api/admin/certificate-templates?activeOnly=true'),
        ]);

        const transitionPayloads = await Promise.all(
          transitionResponses.map(async (response) => (await response.json()) as {
            success: boolean;
            data?: StateTransition[];
          })
        );
        const signerData = await signerResponse.json();
        const templateData = await templateResponse.json();

        const transitionGroups = transitionPayloads.map((payload) =>
          payload.success && Array.isArray(payload.data) ? payload.data : []
        );
        setAvailableTransitions(intersectTransitions(transitionGroups));

        if (signerData.success) {
          setSigners(signerData.data);
        }

        if (templateData.success) {
          setTemplates(templateData.data);
        }
      } catch (error) {
        console.error('Error fetching bulk transition modal data:', error);
      } finally {
        setLoadingTransitions(false);
      }
    };

    void fetchModalData();
  }, [states]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransition) return;

    if (selectedTransition === 'pending_signature' && !selectedSigner) {
      alert('Selecciona un firmante para continuar.');
      return;
    }

    if (selectedTransition === 'issued' && !selectedTemplate) {
      alert('Selecciona una plantilla activa para emitir los certificados.');
      return;
    }

    setLoading(true);
    try {
      const failures: Array<{ label: string; message: string }> = [];

      for (const state of states) {
        try {
          await onExecuteAction({
            certificateId: state.certificateId,
            newState: selectedTransition,
            comments,
            signerId: selectedSigner || undefined,
            templateId: selectedTemplate || undefined,
          });
        } catch (error) {
          failures.push({
            label: getCertificateLabel(state),
            message: error instanceof Error ? error.message : 'No fue posible completar la acción',
          });
        }
      }

      await onCompleted();

      if (failures.length > 0) {
        const failureSummary = failures
          .slice(0, 5)
          .map((failure) => `- ${failure.label}: ${failure.message}`)
          .join('\n');
        const successfulCount = states.length - failures.length;
        alert(
          `Se procesaron ${successfulCount} de ${states.length} certificados.\n\n${failureSummary}${failures.length > 5 ? '\n- ...' : ''}`
        );
      }
    } catch (error) {
      console.error('Error executing bulk transition flow:', error);
      alert(error instanceof Error ? error.message : 'No fue posible completar la acción en lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Cambiar Estado en Lote</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            <span className="font-medium">Certificados seleccionados:</span> {states.length}
          </p>
          <p>
            <span className="font-medium">Estados actuales:</span> {distinctStateLabels.join(', ')}
          </p>
          <p>
            <span className="font-medium">Vista previa:</span> {certificatePreview}
            {remainingCount > 0 ? ` y ${remainingCount} más` : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingTransitions ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Cargando acciones comunes disponibles...
            </div>
          ) : hasAvailableTransitions ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nuevo Estado
              </label>
              <select
                required
                value={selectedTransition}
                onChange={(e) => setSelectedTransition(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona un estado</option>
                {availableTransitions.map((transition) => (
                  <option key={transition.to} value={transition.to}>
                    {transition.actionLabel}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>
                  La selección actual no comparte una transición manual común. Prueba filtrando por
                  estado y seleccionando certificados del mismo punto del flujo.
                </p>
              </div>
            </div>
          )}

          {hasAvailableTransitions && selectedTransition === 'pending_signature' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Firmante asignado
              </label>
              <select
                required
                value={selectedSigner}
                onChange={(e) => setSelectedSigner(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona un firmante</option>
                {signers.map((signer) => (
                  <option key={signer.uid} value={signer.uid}>
                    {signer.displayName} ({signer.roleCode})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Se generará una solicitud de firma para cada certificado seleccionado.
              </p>
            </div>
          )}

          {hasAvailableTransitions && selectedTransition === 'issued' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Plantilla para emisión
              </label>
              <select
                required
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona una plantilla</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Se emitirá el PDF final para cada certificado seleccionado.
              </p>
            </div>
          )}

          {hasAvailableTransitions && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comentarios (opcional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingTransitions || !selectedTransition || !hasAvailableTransitions}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : hasAvailableTransitions ? `Aplicar a ${states.length}` : 'Sin acciones'}
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
                    "{transition.comments}"
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
