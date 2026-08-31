import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { DocumentStatus, DocumentType } from '../types/enums';
import type { DocumentRecord } from '../types/models';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

export const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

export interface DocumentQuery {
  ownerId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  pendingReviewOnly?: boolean;
}

async function handleResponse(res: Response) {
  if (res.ok) {
    if (res.status === 204) return null;
    return await res.json();
  }
  const data = await res.json().catch(() => null);
  if (res.status === 400) throw badRequest(data || { detail: ['Invalid request'] });
  if (res.status === 401 || res.status === 403) throw forbidden(data?.detail || 'Unauthorized');
  if (res.status === 404) throw notFound(data?.detail || 'Not found');
  throw new ApiError(res.status, data || { detail: 'Server error', code: 'server_error' });
}

export async function listDocuments(query: DocumentQuery = {}): Promise<DocumentRecord[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/documents/?${params.toString()}`);
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : data.results || [];
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const res = await apiFetch(`/documents/${id}/`);
  return await handleResponse(res);
}

export interface UploadInput {
  type: DocumentType;
  file: File;
}

export async function uploadDocument(input: UploadInput): Promise<DocumentRecord> {
  const { file, type } = input;
  if (file.size > MAX_FILE_BYTES) {
    throw badRequest({ file: [`Files must be 5 MB or smaller. This file is ${formatBytes(file.size)}.`] });
  }
  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type)) {
    throw badRequest({ file: ['Accepted formats are PDF, DOC, DOCX, JPG and PNG.'] });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  // We do not use apiFetch here directly because we need to omit the Content-Type header
  // so the browser can automatically set it to multipart/form-data with the correct boundary
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/documents/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await handleResponse(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/documents/${id}/`, {
    method: 'DELETE'
  });
  return await handleResponse(res);
}

export async function reviewDocument(
  id: string,
  decision: Extract<DocumentStatus, 'APPROVED' | 'REJECTED'>,
  comment: string
): Promise<DocumentRecord> {
  const res = await apiFetch(`/documents/${id}/review/`, {
    method: 'POST',
    body: JSON.stringify({ decision, comment })
  });
  return await handleResponse(res);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}