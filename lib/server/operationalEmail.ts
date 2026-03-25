import { getEmailProvider, type EmailMessage, type EmailSendResult } from '@/lib/email/provider';
import { getServerSystemSettingsRepository } from '@/lib/server-container';

export type OperationalEmailBlockReason =
  | 'provider-missing'
  | 'delivery-paused'
  | 'settings-unavailable';

export interface OperationalEmailStatusSnapshot {
  configured: boolean;
  source: 'deployment-env';
  provider: string | null;
  from: string | null;
  replyTo: string | null;
  deliveryEnabled: boolean;
  canSend: boolean;
  reason: OperationalEmailBlockReason | null;
}

export interface OperationalEmailSendResult extends EmailSendResult {
  suppressed?: boolean;
  suppressionReason?: OperationalEmailBlockReason;
}

async function resolveOperationalEmailStatus(): Promise<OperationalEmailStatusSnapshot> {
  const provider = getEmailProvider();
  const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || null;

  try {
    const settings = await getServerSystemSettingsRepository().getSettings();
    const deliveryEnabled = settings?.emailDeliveryEnabled !== false;
    const configured = Boolean(provider);

    return {
      configured,
      source: 'deployment-env',
      provider: provider?.name || configuredProvider,
      from: process.env.EMAIL_FROM || null,
      replyTo: process.env.EMAIL_REPLY_TO || null,
      deliveryEnabled,
      canSend: configured && deliveryEnabled,
      reason: !configured ? 'provider-missing' : !deliveryEnabled ? 'delivery-paused' : null,
    };
  } catch (error) {
    console.error('Error resolving operational email settings:', error);

    return {
      configured: Boolean(provider),
      source: 'deployment-env',
      provider: provider?.name || configuredProvider,
      from: process.env.EMAIL_FROM || null,
      replyTo: process.env.EMAIL_REPLY_TO || null,
      deliveryEnabled: false,
      canSend: false,
      reason: 'settings-unavailable',
    };
  }
}

export async function getOperationalEmailStatusSnapshot(): Promise<OperationalEmailStatusSnapshot> {
  return resolveOperationalEmailStatus();
}

export async function sendOperationalEmail(
  message: EmailMessage
): Promise<OperationalEmailSendResult> {
  const status = await resolveOperationalEmailStatus();

  if (!status.canSend) {
    const reason = status.reason ?? 'provider-missing';

    return {
      success: false,
      provider: status.provider || 'none',
      suppressed: true,
      suppressionReason: reason,
      error:
        reason === 'delivery-paused'
          ? 'Los correos operativos están pausados desde Configuración.'
          : reason === 'settings-unavailable'
            ? 'No fue posible verificar la política operativa del correo.'
            : 'No hay proveedor de correo configurado.',
    };
  }

  const provider = getEmailProvider();
  if (!provider) {
    return {
      success: false,
      provider: status.provider || 'none',
      suppressed: true,
      suppressionReason: 'provider-missing',
      error: 'No hay proveedor de correo configurado.',
    };
  }

  return provider.sendEmail(message);
}
