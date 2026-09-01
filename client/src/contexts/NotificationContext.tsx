import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

import { useAuth } from './AuthContext';
import { authStorage } from './authStorage';
import { getNotifications, getNotificationsSocketUrl, markNotificationsRead } from '../lib/authApi';
import {
  getNotificationPreferences,
  playIncomingMessageSound,
  playNotificationSound,
  requestDesktopNotificationPermission,
  setDesktopNotificationsEnabled,
  setMutedNotifications,
  showDesktopNotification,
} from '../lib/sound';
import type { NotificationItem, NotificationPayload } from '../types';
import { showProjectToast } from '../HtmlComponents/HtmlRoster';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  muted: boolean;
  desktopEnabled: boolean;
  desktopPermission: string;
  toggleMuted: () => void;
  toggleDesktopEnabled: () => void;
  requestDesktopPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function upsertNotification(items: NotificationItem[], notification: NotificationItem) {
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

function isChatPageOpen() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/creator/chat') || window.location.pathname.startsWith('/brand/chat');
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [muted, setMuted] = useState(getNotificationPreferences().muted);
  const [desktopEnabled, setDesktopEnabled] = useState(getNotificationPreferences().desktopEnabled);
  const [desktopPermission, setDesktopPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const socketRef = useRef<WebSocket | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser || !authStorage.getAccessToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!notificationIds.length) return;

    await markNotificationsRead({ notification_ids: notificationIds });
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
    await markNotificationsRead({ mark_all: true });
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  const toggleMuted = useCallback(() => {
    const next = setMutedNotifications(!muted);
    setMuted(next.muted);
  }, [muted]);

  const toggleDesktopEnabled = useCallback(() => {
    const next = setDesktopNotificationsEnabled(!desktopEnabled);
    setDesktopEnabled(next.desktopEnabled);
  }, [desktopEnabled]);

  const requestDesktopPermission = useCallback(async () => {
    const permission = await requestDesktopNotificationPermission();
    setDesktopPermission(permission);
    if (permission === 'granted') {
      setDesktopEnabled(true);
      showProjectToast('success', 'Desktop alerts enabled', 'Browser popup notifications are now active.');
      return;
    }
    if (permission === 'denied') {
      showProjectToast('error', 'Desktop alerts blocked', 'Allow notifications in your browser settings to enable them.');
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!currentUser) {
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const token = authStorage.getAccessToken() || '';
    if (!token) return;

    const socket = new WebSocket(getNotificationsSocketUrl(token));
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationPayload;
        if (payload.event === 'notification.created' && payload.notification) {
          setNotifications((prev) => upsertNotification(prev, payload.notification!));
          setUnreadCount((prev) => prev + (payload.notification?.is_read ? 0 : 1));
          if (payload.notification.event_type === 'chat.message.received') {
            if (!isChatPageOpen()) {
              void playIncomingMessageSound();
              showDesktopNotification(payload.notification.title, { body: payload.notification.message });
            }
          } else {
            void playNotificationSound();
            showDesktopNotification(payload.notification.title, { body: payload.notification.message });
          }
          showProjectToast('info', payload.notification.title, payload.notification.message);
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
  }, [currentUser]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      muted,
      desktopEnabled,
      desktopPermission,
      toggleMuted,
      toggleDesktopEnabled,
      requestDesktopPermission,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      muted,
      desktopEnabled,
      desktopPermission,
      toggleMuted,
      toggleDesktopEnabled,
      requestDesktopPermission,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return context;
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    muted,
    desktopEnabled,
    desktopPermission,
    toggleMuted,
    toggleDesktopEnabled,
    requestDesktopPermission,
  } = useNotifications();
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
        className="relative grid h-12 w-12 place-items-center rounded-2xl border border-[#dce5fb] bg-[#f7f9ff] text-[#214bc0] transition hover:bg-[#eef3ff]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#214bc0] px-1.5 py-0.5 text-[11px] font-black leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <div className={`${isOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-1'} absolute right-0 top-[calc(100%+10px)] z-40 w-[min(92vw,24rem)] rounded-3xl border border-[#dce5fb] bg-white p-3 shadow-[0_18px_40px_rgba(45,66,140,0.14)] transition`}>
        <div className="mb-3 flex items-center justify-between px-2 py-1">
          <div>
            <p className="text-sm font-black text-[#173ca8]">Notifications</p>
            <p className="text-xs text-[#667085]">{unreadCount} unread</p>
          </div>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={!unreadCount}
            className="text-xs font-black text-[#214bc0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>

        <div className="mb-3 space-y-2 rounded-2xl border border-[#e5eaf6] bg-[#f8faff] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#173ca8]">Sound alerts</p>
              <p className="text-[11px] text-[#667085]">Play different sounds for chat and other notifications.</p>
            </div>
            <button
              type="button"
              onClick={toggleMuted}
              className={`rounded-full px-3 py-1 text-[11px] font-black ${muted ? 'bg-[#fee4e2] text-[#b42318]' : 'bg-[#dcfae6] text-[#067647]'}`}
            >
              {muted ? 'Muted' : 'On'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#173ca8]">Desktop popups</p>
              <p className="text-[11px] text-[#667085]">Show browser notifications when new messages arrive.</p>
            </div>
            {desktopPermission === 'granted' ? (
              <button
                type="button"
                onClick={toggleDesktopEnabled}
                className={`rounded-full px-3 py-1 text-[11px] font-black ${desktopEnabled ? 'bg-[#dcfae6] text-[#067647]' : 'bg-[#f2f4f7] text-[#344054]'}`}
              >
                {desktopEnabled ? 'Enabled' : 'Off'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void requestDesktopPermission()}
                className="rounded-full bg-[#214bc0] px-3 py-1 text-[11px] font-black text-white"
              >
                {desktopPermission === 'denied' ? 'Blocked' : 'Allow'}
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {isLoading ? <p className="px-2 py-8 text-center text-sm text-[#667085]">Loading notifications...</p> : null}
          {!isLoading && notifications.length === 0 ? <p className="px-2 py-8 text-center text-sm text-[#667085]">No notifications yet.</p> : null}
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
                  className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${notification.is_read ? 'border-[#edf1fb] bg-white' : 'border-[#dbe7ff] bg-[#f5f8ff]'}`}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-[#173ca8]">{notification.title}</p>
                    <span className="shrink-0 text-[11px] text-[#667085]">{formatTimeLabel(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#475467]">{notification.message}</p>
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
