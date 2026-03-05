export type CertificateStateValue = 
  | 'draft'           // Borrador inicial
  | 'pending_review'  // Esperando verificación
  | 'verified'        // Verificado por coordinador
  | 'pending_signature' // Esperando firma
  | 'signed'          // Firmado digitalmente
  | 'issued'          // Emitido y disponible
  | 'cancelled';      // Cancelado/anulado

export interface CertificateState {
  id: string;
  certificateId: string;
  currentState: CertificateStateValue;
  previousState?: CertificateStateValue;
  changedAt: Date;
  changedBy: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface StateTransition {
  from: CertificateStateValue;
  to: CertificateStateValue;
  allowedRoles: string[];
  requiresAction: boolean;
  actionLabel?: string;
  description?: string;
}

export interface StateHistory {
  certificateId: string;
  transitions: CertificateState[];
  createdAt: Date;
  updatedAt: Date;
}

// Definición de transiciones permitidas
export const STATE_TRANSITIONS: StateTransition[] = [
  // Draft → Pending Review
  {
    from: 'draft',
    to: 'pending_review',
    allowedRoles: ['coordinator', 'administrator'],
    requiresAction: true,
    actionLabel: 'Enviar a Verificación',
    description: 'El coordinador envía el certificado para verificación'
  },
  
  // Pending Review → Verified
  {
    from: 'pending_review',
    to: 'verified',
    allowedRoles: ['verifier', 'administrator'],
    requiresAction: true,
    actionLabel: 'Verificar',
    description: 'El verificador aprueba la información del certificado'
  },
  
  // Pending Review → Draft (rechazo)
  {
    from: 'pending_review',
    to: 'draft',
    allowedRoles: ['verifier', 'administrator'],
    requiresAction: true,
    actionLabel: 'Rechazar',
    description: 'Devolver al coordinador para correcciones'
  },
  
  // Verified → Pending Signature
  {
    from: 'verified',
    to: 'pending_signature',
    allowedRoles: ['coordinator', 'administrator'],
    requiresAction: true,
    actionLabel: 'Enviar a Firma',
    description: 'Enviar al firmante para firma digital'
  },
  
  // Pending Signature → Signed
  {
    from: 'pending_signature',
    to: 'signed',
    allowedRoles: ['signer', 'administrator'],
    requiresAction: true,
    actionLabel: 'Firmar',
    description: 'Firma digital del certificado'
  },
  
  // Pending Signature → Verified (rechazo)
  {
    from: 'pending_signature',
    to: 'verified',
    allowedRoles: ['signer', 'administrator'],
    requiresAction: true,
    actionLabel: 'Rechazar Firma',
    description: 'Devolver para correcciones antes de firmar'
  },
  
  // Signed → Issued
  {
    from: 'signed',
    to: 'issued',
    allowedRoles: ['coordinator', 'administrator'],
    requiresAction: true,
    actionLabel: 'Emitir',
    description: 'Hacer disponible el certificado para el participante'
  },
  
  // Cualquier estado → Cancelled (solo admin)
  {
    from: 'draft' as CertificateStateValue,
    to: 'cancelled',
    allowedRoles: ['administrator'],
    requiresAction: true,
    actionLabel: 'Cancelar',
    description: 'Anular el certificado'
  }
];

// Configuración de estados
export const STATE_CONFIG = {
  draft: {
    label: 'Borrador',
    color: 'gray',
    icon: 'edit',
    description: 'Certificado en creación'
  },
  pending_review: {
    label: 'Espera Verificación',
    color: 'yellow',
    icon: 'clock',
    description: 'Esperando revisión por verificador'
  },
  verified: {
    label: 'Verificado',
    color: 'blue',
    icon: 'check',
    description: 'Información verificada correctamente'
  },
  pending_signature: {
    label: 'Espera Firma',
    color: 'purple',
    icon: 'pen',
    description: 'Esperando firma digital'
  },
  signed: {
    label: 'Firmado',
    color: 'indigo',
    icon: 'shield',
    description: 'Certificado firmado digitalmente'
  },
  issued: {
    label: 'Emitido',
    color: 'green',
    icon: 'award',
    description: 'Certificado emitido y disponible'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'red',
    icon: 'x',
    description: 'Certificado anulado'
  }
} as const;
