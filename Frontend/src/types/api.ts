/**
 * Transport-level shapes. Deliberately identical to Django REST Framework conventions
 * so that swapping the mock transport for Axios changes no consumer.
 */

/** DRF `PageNumberPagination` response envelope. */
export interface Paginated<T> {
  count: number;
  next: number | null;
  previous: number | null;
  results: T[];
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/**
 * DRF error body. Field errors arrive keyed by field name; non-field errors arrive
 * under `detail`. The UI reads both through `ApiError`.
 */
export interface ApiErrorBody {
  detail?: string;
  code?: string;
  [field: string]: string | string[] | undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** Field-level messages, excluding the non-field `detail`/`code` keys. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.body)) {
      if (key === 'detail' || key === 'code' || value === undefined) continue;
      out[key] = Array.isArray(value) ? value[0] : value;
    }
    return out;
  }
}

export const badRequest = (body: ApiErrorBody) => new ApiError(400, body);
export const unauthorized = (detail = 'Authentication credentials were not provided.') =>
new ApiError(401, { detail, code: 'not_authenticated' });
export const forbidden = (detail = 'You do not have permission to perform this action.') =>
new ApiError(403, { detail, code: 'permission_denied' });
export const notFound = (detail = 'Not found.') => new ApiError(404, { detail, code: 'not_found' });
export const conflict = (detail: string) => new ApiError(409, { detail, code: 'conflict' });

export interface AuthTokens {
  access: string;
  refresh: string;
}