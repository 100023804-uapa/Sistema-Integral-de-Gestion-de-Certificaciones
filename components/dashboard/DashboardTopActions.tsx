"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { NotificationRecord } from '@/lib/types/notification';

function parseNotificationDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeNotification(item: Record<string, unknown>): NotificationRecord {
  return {
    id: typeof item.id === 'string' ? item.id : '',
    recipientType: item.recipientType === 'student' ? 'student' : 'internal',
    recipientId: typeof item.recipientId === 'string' ? item.recipientId : '',
    recipientKey: typeof item.recipientKey === 'string' ? item.recipientKey : '',
    recipientRoleSnapshot:
      typeof item.recipientRoleSnapshot === 'string' ? item.recipientRoleSnapshot : undefined,
    type: typeof item.type === 'string' ? item.type : 'system.generic',
    category:
      item.category === 'workflow' ||
      item.category === 'signature' ||
      item.category === 'restriction' ||
      item.category === 'access' ||
      item.category === 'system'
        ? item.category
        : 'system',
    priority:
      item.priority === 'high' || item.priority === 'medium' || item.priority === 'low'
        ? item.priority
        : 'medium',
    title: typeof item.title === 'string' ? item.title : '',
    body: typeof item.body === 'string' ? item.body : '',
    ctaLabel: typeof item.ctaLabel === 'string' ? item.ctaLabel : undefined,
    ctaHref: typeof item.ctaHref === 'string' ? item.ctaHref : undefined,
    entityType:
      typeof item.entityType === 'string'
        ? (item.entityType as NotificationRecord['entityType'])
        : undefined,
    entityId: typeof item.entityId === 'string' ? item.entityId : undefined,
    actorUid: typeof item.actorUid === 'string' ? item.actorUid : undefined,
    actorName: typeof item.actorName === 'string' ? item.actorName : undefined,
    readAt: parseNotificationDate(item.readAt),
    deletedAt: parseNotificationDate(item.deletedAt),
    createdAt: parseNotificationDate(item.createdAt) || new Date(),
    updatedAt: parseNotificationDate(item.updatedAt) || new Date(),
    sourceEvent:
      item.sourceEvent && typeof item.sourceEvent === 'object'
        ? {
            key:
              typeof (item.sourceEvent as Record<string, unknown>).key === 'string'
                ? ((item.sourceEvent as Record<string, unknown>).key as string)
                : 'system.generic',
            dedupeKey:
              typeof (item.sourceEvent as Record<string, unknown>).dedupeKey === 'string'
                ? ((item.sourceEvent as Record<string, unknown>).dedupeKey as string)
                : undefined,
          }
        : { key: 'system.generic' },
    delivery:
      item.delivery && typeof item.delivery === 'object'
        ? (item.delivery as NotificationRecord['delivery'])
        : {
            inApp: {
              created: true,
            },
          },
  };
}

function formatRelativeNotificationTime(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (absMinutes < 1) {
    return 'Hace unos segundos';
  }

  if (absMinutes < 60) {
    return formatter.format(Math.round(diffMs / 60000), 'minute');
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return formatter.format(Math.round(diffMs / 3600000), 'hour');
  }

  const absDays = Math.round(absHours / 24);
  if (absDays < 7) {
    return formatter.format(Math.round(diffMs / 86400000), 'day');
  }

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function resolveInternalHref(href?: string) {
  if (!href) {
    return null;
  }

  if (href.startsWith('/')) {
    return href;
  }

  try {
    const resolved = new URL(href, window.location.origin);
    if (resolved.origin === window.location.origin) {
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
  } catch {
    return href;
  }

  return href;
}

export function DashboardTopActions() {
  const router = useRouter();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationActionId, setNotificationActionId] = useState<string | null>(null);
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadLabel = useMemo(
    () => `${unreadCount} ${unreadCount === 1 ? 'nueva' : 'nuevas'}`,
    [unreadCount]
  );

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await fetch('/api/internal/notifications?limit=12', {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success || !Array.isArray(payload?.data?.items)) {
        throw new Error(payload?.error || 'No fue posible cargar las notificaciones.');
      }

      const normalized = payload.data.items.map((item: Record<string, unknown>) =>
        normalizeNotification(item)
      );

      setNotifications(normalized);
      setUnreadCount(
        typeof payload.data.unreadCount === 'number'
          ? payload.data.unreadCount
          : normalized.filter((item) => !item.readAt).length
      );
    } catch (error) {
      console.error('DashboardTopActions: Error fetching notifications', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationStateChange = async (
    notificationId: string,
    action: 'read' | 'unread' | 'delete'
  ) => {
    try {
      setNotificationActionId(notificationId);
      const response = await fetch(`/api/internal/notifications/${notificationId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers:
          action === 'delete'
            ? undefined
            : {
                'Content-Type': 'application/json',
              },
        body: action === 'delete' ? undefined : JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible actualizar la notificación.');
      }

      await loadNotifications();
    } catch (error) {
      console.error('DashboardTopActions: Error updating notification', error);
    } finally {
      setNotificationActionId(null);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      setMarkingAllNotifications(true);
      const response = await fetch('/api/internal/notifications/mark-all-read', {
        method: 'POST',
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible marcar las notificaciones.');
      }

      await loadNotifications();
    } catch (error) {
      console.error('DashboardTopActions: Error marking all notifications as read', error);
    } finally {
      setMarkingAllNotifications(false);
    }
  };

  const handleNotificationOpen = async (notification: NotificationRecord) => {
    if (!notification.readAt) {
      await handleNotificationStateChange(notification.id, 'read');
    }

    if (notification.ctaHref) {
      setShowNotifications(false);
      const targetHref = resolveInternalHref(notification.ctaHref);
      if (!targetHref) return;

      if (targetHref.startsWith('/')) {
        router.push(targetHref);
      } else {
        window.location.assign(targetHref);
      }
    }
  };

  useEffect(() => {
    if (user?.uid) {
      void loadNotifications();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (showNotifications) {
      void loadNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative">
        <button
          onClick={() => setShowNotifications((current) => !current)}
          className={`relative rounded-full border p-3 shadow-sm transition-colors ${
            showNotifications
              ? 'border-accent bg-accent text-white'
              : 'border-gray-100 bg-white text-gray-400 hover:text-accent'
          }`}
          aria-label="Abrir notificaciones"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-3rem)] max-w-96 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-800">Notificaciones</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {unreadLabel}
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center gap-3 p-6 text-sm text-gray-500">
                    <Loader2 size={18} className="animate-spin" />
                    Cargando notificaciones...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-50 p-4 transition-colors ${
                        !notification.readAt ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                            !notification.readAt ? 'bg-accent' : 'bg-gray-200'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => void handleNotificationOpen(notification)}
                                className="w-full text-left"
                              >
                                <p className="text-sm font-bold leading-snug text-gray-800">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm leading-snug text-gray-600">
                                  {notification.body}
                                </p>
                              </button>
                              <p className="mt-2 text-xs text-gray-400">
                                {formatRelativeNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleNotificationStateChange(
                                    notification.id,
                                    notification.readAt ? 'unread' : 'read'
                                  );
                                }}
                                disabled={notificationActionId === notification.id}
                                title={
                                  notification.readAt
                                    ? 'Marcar como no leída'
                                    : 'Marcar como leída'
                                }
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary disabled:opacity-50"
                              >
                                {notification.readAt ? (
                                  <RotateCcw size={16} />
                                ) : (
                                  <CheckCheck size={16} />
                                )}
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleNotificationStateChange(notification.id, 'delete');
                                }}
                                disabled={notificationActionId === notification.id}
                                title="Eliminar"
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-rose-600 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {notification.ctaHref && (
                            <button
                              onClick={() => void handleNotificationOpen(notification)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              {notification.ctaLabel || 'Abrir'}
                              <ExternalLink size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No tienes notificaciones
                  </div>
                )}
              </div>
              <div className="border-t border-gray-50 bg-gray-50/50 p-3 text-center">
                <button
                  onClick={() => void handleMarkAllNotificationsRead()}
                  disabled={markingAllNotifications || unreadCount === 0}
                  className="text-sm font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingAllNotifications ? 'Actualizando...' : 'Marcar todas como leídas'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Avatar
        src={
          user?.photoURL ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'
        }
        fallback={user?.displayName?.charAt(0) || 'U'}
        status="online"
        className="h-12 w-12 cursor-pointer border-2 border-accent/20 md:h-14 md:w-14"
        onClick={() => router.push('/dashboard/settings')}
      />
    </div>
  );
}
