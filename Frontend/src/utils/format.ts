import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** 14 Aug 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, 'd MMM yyyy') : '—';
}

/** 14 Aug 2026, 15:04 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, 'd MMM yyyy, HH:mm') : '—';
}

/** 3 days ago */
export function formatRelative(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Days remaining until a deadline, negative when past. */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const date = toDate(value);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
}

export function deadlineLabel(value: string | Date | null | undefined): string {
  const days = daysUntil(value);
  if (days === null) return '—';
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${days} days left`;
}

/** 12 weeks · 1 Sep – 21 Nov 2026 */
export function dateRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '—';
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${format(s, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(e, 'd MMM yyyy')}`;
}

export function initials(name: string): string {
  return name.
  replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/i, '').
  split(/\s+/).
  filter(Boolean).
  slice(0, 2).
  map((w) => w[0]?.toUpperCase() ?? '').
  join('');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Percentage, clamped and rounded. */
export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round(value / total * 100)));
}