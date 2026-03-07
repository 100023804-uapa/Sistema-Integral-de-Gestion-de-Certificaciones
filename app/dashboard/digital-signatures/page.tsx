"use client";

import React, { useState, useEffect, useRef, type ReactElement } from 'react';
import { SignatureRequest, DigitalSignature } from '@/lib/container';
import { 
  PenTool, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Send,
  Eye,
  FileText,
  Calendar,
  User,
  Mail,
  MapPin,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SIGNATURE_STATUS_LABELS } from '@/lib/types/digitalSignature';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function DigitalSignaturesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const signerId = user?.uid || '';
      if (!signerId) return;
      
      // Obtener solicitudes donde el usuario es el firmante
      const response = await fetch(`/api/admin/digital-signatures?signerId=${signerId}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      } else {
        console.error('Error fetching signature requests:', data.error);
      }

    } catch (error) {
      console.error('Error fetching signature requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleSign = async (request: SignatureRequest) => {
    setSelectedRequest(request);
    setShowSignatureModal(true);
  };

  const handleReject = async (request: SignatureRequest) => {
    const reason = prompt('¿Por qué rechazas esta solicitud de firma?');
    if (!reason) return;

    try {
      const response = await fetch('/api/admin/digital-signatures/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          certificateId: request.certificateId,
          rejectionReason: reason,
          signerId: user?.uid || ''
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchRequests();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error rejecting signature:', error);
      alert('Error al rechazar la firma');
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, ReactElement> = {
      'pending': <Clock size={20} />,
      'signed': <CheckCircle size={20} />,
      'rejected': <XCircle size={20} />,
      'expired': <AlertCircle size={20} />
    };
    return icons[status] || <Clock size={20} />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'signed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'expired': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return request.status === 'pending' && !isExpired(request.expiresAt);
    if (filter === 'expired') return isExpired(request.expiresAt);
    return request.status === filter;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Firmas Digitales</h1>
          <p className="text-gray-600">Gestiona las solicitudes de firma de certificados</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas las solicitudes</option>
            <option value="pending">Pendientes</option>
            <option value="signed">Firmadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Solicitudes Pendientes */}
      {filteredRequests.filter(r => r.status === 'pending' && !isExpired(r.expiresAt)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-500" />
            Solicitudes Pendientes ({filteredRequests.filter(r => r.status === 'pending' && !isExpired(r.expiresAt)).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests
              .filter(r => r.status === 'pending' && !isExpired(r.expiresAt))
              .map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md border p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="font-medium">
                      {SIGNATURE_STATUS_LABELS[request.status as keyof typeof SIGNATURE_STATUS_LABELS]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Expira: {new Date(request.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <p className="font-medium">Certificado: {request.certificateData.folio}</p>
                    <p className="text-gray-600">Estudiante: {request.certificateData.studentName}</p>
                    <p className="text-gray-600">Programa: {request.certificateData.academicProgram}</p>
                  </div>
                  
                  {request.message && (
                    <div className="text-sm">
                      <p className="text-gray-500 italic">&ldquo;{request.message}&rdquo;</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSign(request)}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm flex items-center justify-center gap-1"
                  >
                    <PenTool size={16} />
                    Firmar
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm flex items-center justify-center gap-1"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista Completa de Solicitudes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer",
              getStatusColor(request.status)
            )}
            onClick={() => setSelectedRequest(request)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(request.status)}
                <h3 className="font-semibold text-lg">
                  {SIGNATURE_STATUS_LABELS[request.status as keyof typeof SIGNATURE_STATUS_LABELS]}
                </h3>
              </div>
              {isExpired(request.expiresAt) && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Expirado
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Certificado:</span>
                <p className="font-medium">{request.certificateData.folio}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Estudiante:</span>
                <p className="text-sm text-gray-600">{request.certificateData.studentName}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Programa:</span>
                <p className="text-sm text-gray-600">{request.certificateData.academicProgram}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">Solicitado por:</span>
                <p className="text-sm text-gray-600">{request.requestedBy}</p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                <span>Solicitado: {new Date(request.requestedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>Expira: {new Date(request.expiresAt).toLocaleDateString()}</span>
              </div>

              {request.respondedAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={12} />
                  <span>Respondido: {new Date(request.respondedAt).toLocaleDateString()}</span>
                </div>
              )}

              {request.rejectionReason && (
                <div>
                  <span className="text-sm text-gray-500">Razón de rechazo:</span>
                  <p className="text-sm text-red-600 italic">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <PenTool className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes de firma</h3>
          <p className="text-gray-600">
            Las solicitudes de firma aparecerán aquí cuando los coordinadores las envíen
          </p>
        </div>
      )}

      {/* Modal de Firma */}
      {showSignatureModal && selectedRequest && (
        <SignatureModal
          request={selectedRequest}
          signerId={user?.uid || ''}
          onClose={() => setShowSignatureModal(false)}
          onSuccess={() => {
            setShowSignatureModal(false);
            fetchRequests();
          }}
        />
      )}

      {/* Modal de Detalles */}
      {selectedRequest && !showSignatureModal && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

// Componente de modal de firma
function SignatureModal({ 
  request,
  signerId,
  onClose, 
  onSuccess 
}: { 
  request: SignatureRequest;
  signerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [signatureData, setSignatureData] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCanvasPos = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureData) return;

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/digital-signatures/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sign',
          certificateId: request.certificateId,
          signatureBase64: signatureData,
          comments,
          signerId: signerId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error signing certificate:', error);
      alert('Error al firmar el certificado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Firmar Certificado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Certificado: <span className="font-medium">{request.certificateData.folio}</span>
          </p>
          <p className="text-sm text-gray-600">
            Estudiante: <span className="font-medium">{request.certificateData.studentName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma Digital * <span className="text-xs font-normal text-gray-400">(dibuja tu firma en el recuadro)</span>
            </label>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ background: signatureData ? 'white' : 'repeating-linear-gradient(0deg, transparent, transparent 29px, #e5e7eb 29px, #e5e7eb 30px)' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">* La firma es obligatoria</p>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Limpiar firma
              </button>
            </div>
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
              placeholder="Añade comentarios sobre esta firma..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Al firmar este certificado, confirmas que toda la información es correcta y auténtica.
            </p>
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
              disabled={loading || !signatureData}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Firmando...' : 'Firmar Certificado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente de modal de detalles
function RequestDetailsModal({ 
  request, 
  onClose 
}: { 
  request: SignatureRequest;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detalles de Solicitud</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-500">Certificado:</span>
            <p className="font-medium">{request.certificateData.folio}</p>
          </div>
          
          <div>
            <span className="text-sm text-gray-500">Estudiante:</span>
            <p className="font-medium">{request.certificateData.studentName}</p>
          </div>
          
          <div>
            <span className="text-sm text-gray-500">Programa:</span>
            <p className="font-medium">{request.certificateData.academicProgram}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Solicitado por:</span>
            <p className="font-medium">{request.requestedBy}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Fecha de solicitud:</span>
            <p className="font-medium">{new Date(request.requestedAt).toLocaleString()}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Expira:</span>
            <p className="font-medium">{new Date(request.expiresAt).toLocaleString()}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Estado:</span>
            <p className="font-medium">{SIGNATURE_STATUS_LABELS[request.status as keyof typeof SIGNATURE_STATUS_LABELS]}</p>
          </div>

          {request.message && (
            <div>
              <span className="text-sm text-gray-500">Mensaje:</span>
              <p className="text-sm text-gray-600 italic">&ldquo;{request.message}&rdquo;</p>
            </div>
          )}

          {request.rejectionReason && (
            <div>
              <span className="text-sm text-gray-500">Razón de rechazo:</span>
              <p className="text-sm text-red-600 italic">{request.rejectionReason}</p>
            </div>
          )}
        </div>

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
