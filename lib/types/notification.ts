export type NotificationRecipientType = 'internal' | 'student';
export type NotificationCategory =
  | 'workflow'
  | 'signature'
  | 'restriction'
  | 'access'
  | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationEntityType =
  | 'certificate'
  | 'student'
  | 'internal_user'
  | 'signature_request'
  | 'program';

export interface NotificationTarget {
  recipientType: NotificationRecipientType;
  recipientId: string;
  recipientRoleSnapshot?: string;
}

export interface NotificationDeliveryChannel {
  attempted: boolean;
  sent: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
  sentAt?: Date | null;
}

export interface NotificationRecord {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  recipientKey: string;
  recipientRoleSnapshot?: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  actorUid?: string;
  actorName?: string;
  readAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sourceEvent: {
    key: string;
    dedupeKey?: string;
  };
  delivery: {
    inApp: {
      created: boolean;
    };
    email?: NotificationDeliveryChannel;
  };
}

export interface CreateNotificationFanoutInput {
  targets: NotificationTarget[];
  type: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  actorUid?: string;
  actorName?: string;
  sourceEvent: {
    key: string;
    dedupeKey?: string;
  };
  delivery?: {
    email?: NotificationDeliveryChannel;
  };
}

export interface NotificationListResult {
  items: NotificationRecord[];
  unreadCount: number;
  totalCount: number;
}
