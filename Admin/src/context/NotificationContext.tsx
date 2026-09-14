import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

import * as api from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface AdminNotificationActor {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminNotificationItem {
  notification_id: string;
  event_type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  actor: AdminNotificationActor | null;
}

interface NotificationContextValue {
  notifications: AdminNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function upsertNotification(items: AdminNotificationItem[], notification: AdminNotificationItem) {
  const next = [notification, ...items.filter((item) => item.notification_id !== notification.notification_id)];
  return next.slice(0, 30);
}

function formatTimeLabel(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { info } = useToast();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !api.getSession()?.access) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!notificationIds.length) return;
    await api.markNotificationsRead({ notification_ids: notificationIds });
    setNotifications((prev) =>
      prev.map((item) =>
        notificationIds.includes(item.notification_id)
          ? { ...item, is_read: true, read_at: item.read_at || new Date().toISOString() }
          : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.markNotificationsRead({ mark_all: true });
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const token = api.getSession()?.access || '';
    if (!token) return;

    const socket = new WebSocket(api.getNotificationsSocketUrl(token));
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { event?: string; unread_count?: number; notification?: AdminNotificationItem };
        if (payload.event === 'notification.created' && payload.notification) {
          setNotifications((prev) => upsertNotification(prev, payload.notification!));
          setUnreadCount((prev) => prev + (payload.notification?.is_read ? 0 : 1));
          info(payload.notification.title, payload.notification.message);
          return;
        }
        if (payload.event === 'notification.unread_count' && typeof payload.unread_count === 'number') {
          setUnreadCount(payload.unread_count);
        }
      } catch (error) {
        console.error('Failed to parse notification payload', error);
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [info, isAuthenticated]);

  const value = useMemo(
    () => ({ notifications, unreadCount, isLoading, isConnected, refreshNotifications, markAsRead, markAllAsRead }),
    [notifications, unreadCount, isLoading, isConnected, refreshNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white dark:bg-indigo-500">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <div className={`${isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'} absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900`}>
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
          </div>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={!unreadCount}
            className="text-xs font-semibold text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-400"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {isLoading ? <p className="px-2 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p> : null}
          {!isLoading && notifications.length === 0 ? <p className="px-2 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p> : null}
          {!isLoading
            ? notifications.map((notification) => (
                <button
                  key={notification.notification_id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (!notification.is_read) {
                      void markAsRead([notification.notification_id]);
                    }
                  }}
                  className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${notification.is_read ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900 dark:bg-indigo-950/40'}`}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                    <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">{formatTimeLabel(notification.created_at)}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{notification.message}</p>
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
