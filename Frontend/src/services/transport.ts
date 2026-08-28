/**
 * Mock transport.
 *
 * Every service call routes through `request`, which simulates network latency and
 * surfaces failures as `ApiError` with a DRF-shaped body. Replacing this file with an
 * Axios instance (base URL from VITE_API_URL, JWT bearer + refresh interceptors) is the
 * single change required to move onto the real backend.
 */

import { ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';

const MIN_LATENCY = 90;
const MAX_LATENCY = 260;

function latency() {
  return MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
}

export function request<T>(handler: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(handler());
      } catch (error) {
        if (error instanceof ApiError) {
          reject(error);
        } else {
          reject(
            new ApiError(500, {
              detail: 'An unexpected error occurred. Please try again.',
              code: 'server_error'
            })
          );
        }
      }
    }, latency());
  });
}

export const DEFAULT_PAGE_SIZE = 10;

/** Mirrors DRF `PageNumberPagination`. */
export function paginate<T>(items: T[], query: PageQuery = {}): Paginated<T> {
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return {
    count: items.length,
    next: page < totalPages ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results
  };
}

/** Case-insensitive substring match across the supplied fields. */
export function matchesSearch(term: string | undefined, ...fields: (string | undefined | null)[]) {
  if (!term) return true;
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => (f ?? '').toLowerCase().includes(needle));
}