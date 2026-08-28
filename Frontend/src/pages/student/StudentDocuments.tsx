import React, { useState } from 'react';
import { FileTextIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Select } from '../../components/ui/Form';
import { StatusBadge } from '../../components/ui/Badge';
import { FileUpload } from '../../components/ui/FileUpload';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  deleteDocument,
  formatBytes,
  listDocuments,
  uploadDocument } from
'../../services/documentService';
import { DOCUMENT_TYPES, REQUIRED_STUDENT_DOCUMENTS, label } from '../../types/enums';
import type { DocumentType } from '../../types/enums';
import { checkRequiredDocuments } from '../../domain/rules';
import { formatDate } from '../../utils/format';
import { useToast } from '../../contexts/ToastContext';

export function StudentDocuments() {
  const toast = useToast();
  const state = useAsync(() => listDocuments(), []);
  const [type, setType] = useState<DocumentType>('CV');

  const upload = useMutation(async (file: File) => {
    const record = await uploadDocument({ type, file });
    toast.success('Document uploaded', 'The attachment office will review it shortly.');
    state.refetch();
    return record;
  });

  const remove = useMutation(async (id: string) => {
    await deleteDocument(id);
    toast.success('Document removed');
    state.refetch();
  });

  const documents = state.data ?? [];
  const readiness = checkRequiredDocuments(documents);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Your CV, introduction letter and insurance cover must be approved before the university can approve a placement." />
      

      {!readiness.ready && documents.length > 0 &&
      <div className="mb-5 rounded-md border border-pending-border bg-pending-bg px-4 py-3 text-[13px] text-pending-fg">
          Outstanding for placement approval:{' '}
          {[...readiness.missing, ...readiness.unapproved].map((t) => label(t)).join(', ')}.
        </div>
      }

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader
            title="Uploaded documents"
            description={`${documents.length} on file`} />
          
          {state.loading && !state.data ?
          <LoadingState rows={4} /> :
          state.error ?
          <ErrorState message={state.error} onRetry={state.refetch} /> :
          documents.length === 0 ?
          <EmptyState
            icon={<FileTextIcon className="h-5 w-5" />}
            title="No documents uploaded"
            description="Upload your CV, university introduction letter and insurance cover to begin applying." /> :


          <ul className="divide-y divide-slate-100">
              {documents.map((doc) =>
            <li key={doc.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-navy-900">{label(doc.type)}</p>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {doc.filename} · {formatBytes(doc.sizeBytes)} · uploaded{' '}
                        {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.reviewComment &&
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                          <span className="font-medium">Reviewer:</span> {doc.reviewComment}
                        </p>
                  }
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.status} />
                      {doc.status !== 'APPROVED' &&
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${doc.filename}`}
                    icon={<Trash2Icon className="h-3.5 w-3.5" />}
                    loading={remove.submitting}
                    onClick={() => remove.run(doc.id)} />

                  }
                    </div>
                  </div>
                </li>
            )}
            </ul>
          }
          {remove.error &&
          <CardBody>
              <FormError message={remove.error} />
            </CardBody>
          }
        </Card>

        <Card>
          <CardHeader title="Upload a document" />
          <CardBody className="space-y-4">
            <FormError message={upload.error ?? upload.fieldErrors.file} />
            <Field label="Document type" htmlFor="documentType" required>
              <Select
                id="documentType"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                options={DOCUMENT_TYPES.filter((t) => t !== 'COMPANY_REGISTRATION').map((t) => ({
                  value: t,
                  label: label(t)
                }))} />
              
            </Field>
            <FileUpload onSelect={(file) => upload.run(file)} disabled={upload.submitting} />
            <p className="text-[12px] leading-relaxed text-slate-500">
              Required for placement approval:{' '}
              {REQUIRED_STUDENT_DOCUMENTS.map((t) => label(t)).join(', ')}. Documents are private —
              only you, the attachment office, organisations you apply to and your assigned
              supervisor can open them.
            </p>
          </CardBody>
        </Card>
      </div>
    </>);

}