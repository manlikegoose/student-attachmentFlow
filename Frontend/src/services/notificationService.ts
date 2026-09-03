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

import { apiFetch } from './apiClient';
import type { Notification } from '../types/models';

export async function listNotifications(limit?: number): Promise<Notification[]> {
  const query = limit ? `?limit=${limit}` : '';
  const res = await apiFetch(`/notifications/${query}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function unreadCount(): Promise<number> {
  const res = await apiFetch('/notifications/unread-count/');
  if (!res.ok) throw new Error('Failed to fetch unread count');
  return res.json();
}

export async function markRead(id: string): Promise<Notification> {
  const res = await apiFetch(`/notifications/${id}/read/`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark read');
  return res.json();
}

export async function markAllRead(): Promise<void> {
  const res = await apiFetch('/notifications/read-all/', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to mark all read');
}