import { getAdminDb } from '@/lib/firebaseAdmin';
import type { OperationalEmailSendResult } from '@/lib/server/operationalEmail';
import type {
  CreateNotificationFanoutInput,
  NotificationDeliveryChannel,
  NotificationListResult,
  NotificationRecord,
  NotificationTarget,
} from '@/lib/types/notification';

const COLLECTION_NAME = 'notifications';
const INTERNAL_USERS_COLLECTION = 'internal_users';
const STUDENTS_COLLECTION = 'students';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildRecipientKey(target: NotificationTarget) {
  return `${target.recipientType}:${target.recipientId}`;
}

function mapEmailDeliveryResult(
  result?: OperationalEmailSendResult | null
): NotificationDeliveryChannel | undefined {
  if (!result) {
    return undefined;
  }

  return {
    attempted: result.suppressed !== true,
    sent: result.success,
    provider: result.provider,
    messageId: result.messageId,
    error: result.error,
    sentAt: result.success ? new Date() : null,
  };
}

function mapNotificationRecord(
  id: string,
  source: Record<string, unknown>
): NotificationRecord {
  const sourceEvent =
    source.sourceEvent && typeof source.sourceEvent === 'object'
      ? (source.sourceEvent as Record<string, unknown>)
      : {};
  const delivery =
    source.delivery && typeof source.delivery === 'object'
      ? (source.delivery as Record<string, unknown>)
      : {};
  const deliveryInApp =
    delivery.inApp && typeof delivery.inApp === 'object'
      ? (delivery.inApp as Record<string, unknown>)
      : {};
  const deliveryEmail =
    delivery.email && typeof delivery.email === 'object'
      ? (delivery.email as Record<string, unknown>)
      : null;

  return {
    id,
    recipientType: source.recipientType === 'student' ? 'student' : 'internal',
    recipientId: typeof source.recipientId === 'string' ? source.recipientId : '',
    recipientKey: typeof source.recipientKey === 'string' ? source.recipientKey : '',
    recipientRoleSnapshot:
      typeof source.recipientRoleSnapshot === 'string'
        ? source.recipientRoleSnapshot
        : undefined,
    type: typeof source.type === 'string' ? source.type : 'system.generic',
    category:
      source.category === 'workflow' ||
      source.category === 'signature' ||
      source.category === 'restriction' ||
      source.category === 'access' ||
      source.category === 'system'
        ? source.category
        : 'system',
    priority:
      source.priority === 'high' || source.priority === 'medium' || source.priority === 'low'
        ? source.priority
        : 'medium',
    title: typeof source.title === 'string' ? source.title : '',
    body: typeof source.body === 'string' ? source.body : '',
    ctaLabel: typeof source.ctaLabel === 'string' ? source.ctaLabel : undefined,
    ctaHref: typeof source.ctaHref === 'string' ? source.ctaHref : undefined,
    entityType:
      typeof source.entityType === 'string' ? (source.entityType as NotificationRecord['entityType']) : undefined,
    entityId: typeof source.entityId === 'string' ? source.entityId : undefined,
    actorUid: typeof source.actorUid === 'string' ? source.actorUid : undefined,
    actorName: typeof source.actorName === 'string' ? source.actorName : undefined,
    readAt: toDate(source.readAt),
    deletedAt: toDate(source.deletedAt),
    createdAt: toDate(source.createdAt) || new Date(),
    updatedAt: toDate(source.updatedAt) || new Date(),
    sourceEvent: {
      key: typeof sourceEvent.key === 'string' ? sourceEvent.key : 'system.generic',
      dedupeKey:
        typeof sourceEvent.dedupeKey === 'string' ? sourceEvent.dedupeKey : undefined,
    },
    delivery: {
      inApp: {
        created: deliveryInApp.created === true,
      },
      email: deliveryEmail
        ? {
            attempted: deliveryEmail.attempted === true,
            sent: deliveryEmail.sent === true,
            provider:
              typeof deliveryEmail.provider === 'string'
                ? deliveryEmail.provider
                : undefined,
            messageId:
              typeof deliveryEmail.messageId === 'string'
                ? deliveryEmail.messageId
                : undefined,
            error:
              typeof deliveryEmail.error === 'string' ? deliveryEmail.error : undefined,
            sentAt: toDate(deliveryEmail.sentAt),
          }
        : undefined,
    },
  };
}

async function resolveActorName(actorUid?: string, actorName?: string) {
  if (actorName && actorName.trim()) {
    return actorName.trim();
  }

  if (!actorUid) {
    return undefined;
  }

  const internalUserDoc = await getAdminDb()
    .collection(INTERNAL_USERS_COLLECTION)
    .doc(actorUid)
    .get();

  if (!internalUserDoc.exists) {
    return undefined;
  }

  const data = internalUserDoc.data() || {};
  if (typeof data.displayName === 'string' && data.displayName.trim()) {
    return data.displayName.trim();
  }

  if (typeof data.email === 'string' && data.email.trim()) {
    return data.email.trim().toLowerCase();
  }

  return undefined;
}

export async function resolveInternalNotificationTargetsByRoles(
  roleCodes: string[]
): Promise<NotificationTarget[]> {
  if (roleCodes.length === 0) {
    return [];
  }

  const roleSet = new Set(roleCodes);
  const snapshot = await getAdminDb().collection(INTERNAL_USERS_COLLECTION).get();

  return snapshot.docs
    .map((doc) => ({
      uid: doc.id,
      data: doc.data() as Record<string, unknown>,
    }))
    .filter(
      ({ data }) =>
        data.status !== 'disabled' &&
        typeof data.roleCode === 'string' &&
        roleSet.has(data.roleCode)
    )
    .map(({ uid, data }) => ({
      recipientType: 'internal' as const,
      recipientId: uid,
      recipientRoleSnapshot:
        typeof data.roleCode === 'string' ? data.roleCode : undefined,
    }));
}

export async function resolveStudentNotificationTarget(
  studentId: string
): Promise<NotificationTarget | null> {
  const studentDoc = await getAdminDb().collection(STUDENTS_COLLECTION).doc(studentId).get();
  if (!studentDoc.exists) {
    return null;
  }

  return {
    recipientType: 'student',
    recipientId: studentDoc.id,
  };
}

export async function createNotificationFanout(
  input: CreateNotificationFanoutInput
): Promise<void> {
  const uniqueTargets = Array.from(
    new Map(
      input.targets
        .filter((target) => target.recipientId.trim().length > 0)
        .map((target) => [buildRecipientKey(target), target])
    ).values()
  );

  if (uniqueTargets.length === 0) {
    return;
  }

  const actorName = await resolveActorName(input.actorUid, input.actorName);
  const timestamp = new Date();
  const emailDelivery = input.delivery?.email;
  const batch = getAdminDb().batch();

  for (const target of uniqueTargets) {
    const docRef = getAdminDb().collection(COLLECTION_NAME).doc();
    batch.set(docRef, {
      recipientType: target.recipientType,
      recipientId: target.recipientId,
      recipientKey: buildRecipientKey(target),
      recipientRoleSnapshot: target.recipientRoleSnapshot || null,
      type: input.type,
      category: input.category,
      priority: input.priority || 'medium',
      title: input.title,
      body: input.body,
      ctaLabel: input.ctaLabel || null,
      ctaHref: input.ctaHref || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      actorUid: input.actorUid || null,
      actorName: actorName || null,
      readAt: null,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceEvent: {
        key: input.sourceEvent.key,
        dedupeKey: input.sourceEvent.dedupeKey || null,
      },
      delivery: {
        inApp: {
          created: true,
        },
        email: emailDelivery
          ? {
              attempted: emailDelivery.attempted,
              sent: emailDelivery.sent,
              provider: emailDelivery.provider || null,
              messageId: emailDelivery.messageId || null,
              error: emailDelivery.error || null,
              sentAt: emailDelivery.sentAt || null,
            }
          : null,
      },
    });
  }

  await batch.commit();
}

export async function createNotificationFanoutWithEmailResult(
  input: Omit<CreateNotificationFanoutInput, 'delivery'>,
  emailResult?: OperationalEmailSendResult | null
) {
  return createNotificationFanout({
    ...input,
    delivery: {
      email: mapEmailDeliveryResult(emailResult),
    },
  });
}

export async function listNotificationsForInternalUser(
  uid: string,
  limit = 12
): Promise<NotificationListResult> {
  const snapshot = await getAdminDb()
    .collection(COLLECTION_NAME)
    .where('recipientKey', '==', `internal:${uid}`)
    .get();

  const allItems = snapshot.docs
    .map((doc) => mapNotificationRecord(doc.id, doc.data() as Record<string, unknown>))
    .filter((item) => !item.deletedAt)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return {
    items: allItems.slice(0, limit),
    unreadCount: allItems.filter((item) => !item.readAt).length,
    totalCount: allItems.length,
  };
}

async function getInternalNotificationOrThrow(uid: string, notificationId: string) {
  const docRef = getAdminDb().collection(COLLECTION_NAME).doc(notificationId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('Notificación no encontrada');
  }

  const record = mapNotificationRecord(
    docSnap.id,
    docSnap.data() as Record<string, unknown>
  );

  if (record.recipientKey !== `internal:${uid}`) {
    throw new Error('No tienes permiso sobre esta notificación');
  }

  return { docRef, record };
}

export async function markNotificationReadStateForInternalUser(
  uid: string,
  notificationId: string,
  read: boolean
) {
  const { docRef, record } = await getInternalNotificationOrThrow(uid, notificationId);
  const now = new Date();

  await docRef.set(
    {
      readAt: read ? now : null,
      updatedAt: now,
    },
    { merge: true }
  );

  return {
    ...record,
    readAt: read ? now : null,
    updatedAt: now,
  };
}

export async function deleteNotificationForInternalUser(uid: string, notificationId: string) {
  const { docRef, record } = await getInternalNotificationOrThrow(uid, notificationId);
  const now = new Date();

  await docRef.set(
    {
      deletedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  return {
    ...record,
    deletedAt: now,
    updatedAt: now,
  };
}

export async function markAllNotificationsReadForInternalUser(uid: string) {
  const snapshot = await getAdminDb()
    .collection(COLLECTION_NAME)
    .where('recipientKey', '==', `internal:${uid}`)
    .get();

  const unreadDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return !data.deletedAt && !data.readAt;
  });

  if (unreadDocs.length === 0) {
    return 0;
  }

  const now = new Date();
  const batch = getAdminDb().batch();

  for (const doc of unreadDocs) {
    batch.set(
      doc.ref,
      {
        readAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  await batch.commit();
  return unreadDocs.length;
}
