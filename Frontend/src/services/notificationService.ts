/**
 * Notification service.
 *
 * Endpoint map (future DRF):
 *   GET   /api/notifications/            → listNotifications (own only)
 *   PATCH /api/notifications/:id/read/   → markRead
 *   POST  /api/notifications/read-all/   → markAllRead
 *
 * The notification service is deliberately a single seam. Phase 2 adds email, SMS and
 * WhatsApp fan-out behind the same event calls made from the workflow services.
 */

import { notFound } from '../types/api';
import type { Notification } from '../types/models';
import { read, write } from './store';
import { request } from './transport';
import { requireActor } from './session';

export function listNotifications(limit?: number): Promise<Notification[]> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = db.notifications.
      filter((n) => n.userId === actor.userId).
      sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
      return limit ? rows.slice(0, limit) : rows;
    });
  });
}

export function unreadCount(): Promise<number> {
  return request(() => {
    const actor = requireActor();
    return read((db) => db.notifications.filter((n) => n.userId === actor.userId && !n.read).length);
  });
}

export function markRead(id: string): Promise<Notification> {
  return request(() => {
    const actor = requireActor();
    return write((db) => {
      const n = db.notifications.find((x) => x.id === id && x.userId === actor.userId);
      if (!n) throw notFound('Notification not found.');
      n.read = true;
      return n;
    });
  });
}

export function markAllRead(): Promise<void> {
  return request(() => {
    const actor = requireActor();
    write((db) => {
      db.notifications.forEach((n) => {
        if (n.userId === actor.userId) n.read = true;
      });
    });
  });
}