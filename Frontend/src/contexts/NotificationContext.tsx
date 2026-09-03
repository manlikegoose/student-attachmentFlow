import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Notification } from '../types/models';
import * as notificationService from '../services/notificationService';

import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reload: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: {children: React.ReactNode;}) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const reload = useCallback(() => {
    if (!session) {
      setNotifications([]);
      return;
    }
    notificationService.
    listNotifications().
    then(setNotifications).
    catch(() => setNotifications([]));
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  // When polling or WebSocket is implemented, it would call reload() here.
  // For now, we rely on manual reloads or route changes.

  const markRead = useCallback(
    async (id: string) => {
      await notificationService.markRead(id);
    },
    []
  );

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unread: notifications.filter((n) => !n.read).length,
      markRead,
      markAllRead,
      reload
    }),
    [notifications, markRead, markAllRead, reload]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}