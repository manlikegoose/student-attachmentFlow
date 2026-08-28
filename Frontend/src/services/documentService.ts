/**
 * Document service.
 *
 * Endpoint map (future DRF):
 *   GET    /api/documents/            → listDocuments (authorization-scoped)
 *   POST   /api/documents/            → uploadDocument (multipart)
 *   DELETE /api/documents/:id/        → deleteDocument (owner, PENDING only)
 *   POST   /api/documents/:id/review/ → reviewDocument (COORDINATOR)
 *   GET    /api/documents/:id/file/   → signed, authorization-checked download
 *
 * Storage note: the file itself never travels through business logic. Today an object
 * URL is held in the browser; in production the API returns a short-lived signed URL
 * from whichever backend is configured (local, S3, R2, Cloudinary). No caller of this
 * module assumes a storage provider.
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { DocumentStatus, DocumentType } from '../types/enums';
import type { DocumentRecord } from '../types/models';
import { canViewDocument } from '../domain/rules';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { request } from './transport';
import { requireActor, requireRole } from './session';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = [
'application/pdf',
'application/msword',
'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'image/jpeg',
'image/png'];

export const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

export interface DocumentQuery {
  ownerId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  pendingReviewOnly?: boolean;
}

export function listDocuments(query: DocumentQuery = {}): Promise<DocumentRecord[]> {
  return request(() => {
    const actor = requireActor();
    return read((db) =>
    db.documents.
    filter((d) => canViewDocument(actor, d, db.applications, db.placements)).
    filter(
      (d) =>
      (!query.ownerId || d.ownerId === query.ownerId) && (
      !query.type || d.type === query.type) && (
      !query.status || d.status === query.status) && (
      !query.pendingReviewOnly || d.status === 'PENDING')
    ).
    sort((a, b) => a.uploadedAt < b.uploadedAt ? 1 : -1)
    );
  });
}

export function getDocument(id: string): Promise<DocumentRecord> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const d = db.documents.find((x) => x.id === id);
      if (!d) throw notFound('Document not found.');
      if (!canViewDocument(actor, d, db.applications, db.placements)) {
        throw forbidden('You are not permitted to access this document.');
      }
      return d;
    });
  });
}

export interface UploadInput {
  type: DocumentType;
  file: File;
}

export function uploadDocument(input: UploadInput): Promise<DocumentRecord> {
  return request(() => {
    const actor = requireActor();
    const { file, type } = input;
    if (file.size > MAX_FILE_BYTES) {
      throw badRequest({ file: [`Files must be 5 MB or smaller. This file is ${formatBytes(file.size)}.`] });
    }
    if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type)) {
      throw badRequest({ file: ['Accepted formats are PDF, DOC, DOCX, JPG and PNG.'] });
    }
    const previewUrl = URL.createObjectURL(file);
    return write((db) => {
      const record: DocumentRecord = {
        id: nextId('doc'),
        ownerId: actor.profileId,
        ownerRole: actor.role,
        type,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploadedAt: nowISO(),
        status: 'PENDING',
        previewUrl
      };
      db.documents.push(record);
      db.coordinators.forEach((c) =>
      pushNotification(db, {
        userId: c.userId,
        type: 'DOCUMENT',
        title: 'Document awaiting review',
        message: `${actor.fullName} uploaded ${file.name}.`,
        link: '/coordinator/students'
      })
      );
      return record;
    });
  });
}

export function deleteDocument(id: string): Promise<void> {
  return request(() => {
    const actor = requireActor();
    write((db) => {
      const d = db.documents.find((x) => x.id === id);
      if (!d) throw notFound('Document not found.');
      if (d.ownerId !== actor.profileId) throw forbidden();
      if (d.status === 'APPROVED') {
        throw badRequest({ detail: 'An approved document cannot be removed. Contact the attachment office.' });
      }
      const attached = db.applications.some((a) => a.documentIds.includes(id));
      if (attached) {
        throw badRequest({ detail: 'This document is attached to an application and cannot be removed.' });
      }
      db.documents = db.documents.filter((x) => x.id !== id);
    });
  });
}

export function reviewDocument(
id: string,
decision: Extract<DocumentStatus, 'APPROVED' | 'REJECTED'>,
comment: string)
: Promise<DocumentRecord> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const d = db.documents.find((x) => x.id === id);
      if (!d) throw notFound('Document not found.');
      if (decision === 'REJECTED' && !comment.trim()) {
        throw badRequest({ comment: ['A reason is required when rejecting a document.'] });
      }
      d.status = decision;
      d.reviewedById = actor.profileId;
      d.reviewedAt = nowISO();
      d.reviewComment = comment.trim() || null;

      const student = db.students.find((s) => s.id === d.ownerId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'DOCUMENT',
          title: decision === 'APPROVED' ? 'Document approved' : 'Document rejected',
          message:
          decision === 'APPROVED' ?
          `${d.filename} was approved by the attachment office.` :
          `${d.filename} was rejected: ${comment}`,
          link: '/student/documents'
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: decision === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
        objectType: 'Document',
        objectId: d.id,
        objectLabel: `${student?.fullName ?? 'Owner'} — ${d.filename}`,
        metadata: comment ? { comment } : undefined
      });
      return d;
    });
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}