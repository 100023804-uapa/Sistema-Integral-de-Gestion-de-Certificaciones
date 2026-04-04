import type { NotificationCategory, NotificationPriority } from '@/lib/types/notification';

export interface NotificationEventDefinition {
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  emailByDefault: boolean;
  audience: 'internal' | 'student';
}

export const NOTIFICATION_EVENT_MATRIX = {
  certificatePendingReview: {
    type: 'certificate.pending_review',
    category: 'workflow',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  certificateReturnedToDraft: {
    type: 'certificate.returned_to_draft',
    category: 'workflow',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  signatureRequested: {
    type: 'signature.requested',
    category: 'signature',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  signatureApproved: {
    type: 'signature.approved',
    category: 'signature',
    priority: 'medium',
    emailByDefault: true,
    audience: 'internal',
  },
  signatureRejected: {
    type: 'signature.rejected',
    category: 'signature',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  certificateRestrictionAppliedInternal: {
    type: 'certificate.restriction.applied.internal',
    category: 'restriction',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  certificateRestrictionReleasedInternal: {
    type: 'certificate.restriction.released.internal',
    category: 'restriction',
    priority: 'medium',
    emailByDefault: true,
    audience: 'internal',
  },
  certificateAvailable: {
    type: 'certificate.available',
    category: 'workflow',
    priority: 'high',
    emailByDefault: true,
    audience: 'student',
  },
  internalUserInvited: {
    type: 'internal_user.invited',
    category: 'access',
    priority: 'high',
    emailByDefault: true,
    audience: 'internal',
  },
  internalUserInviteResent: {
    type: 'internal_user.invite_resent',
    category: 'access',
    priority: 'medium',
    emailByDefault: true,
    audience: 'internal',
  },
  studentPortalAccessActivated: {
    type: 'student.portal_access.activated',
    category: 'access',
    priority: 'high',
    emailByDefault: false,
    audience: 'student',
  },
  studentPortalAccessReset: {
    type: 'student.portal_access.reset',
    category: 'access',
    priority: 'high',
    emailByDefault: false,
    audience: 'student',
  },
} satisfies Record<string, NotificationEventDefinition>;
