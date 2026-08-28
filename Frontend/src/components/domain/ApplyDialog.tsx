import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTextIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormError, Textarea } from '../ui/Form';
import { EmptyState } from '../ui/States';
import { StatusBadge } from '../ui/Badge';
import { label } from '../../types/enums';
import type { DocumentRecord } from '../../types/models';
import type { OpportunityView } from '../../types/views';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { listDocuments } from '../../services/documentService';
import { createApplication } from '../../services/applicationService';
import { useToast } from '../../contexts/ToastContext';
import { formatBytes } from '../../services/documentService';

export function ApplyDialog({
  opportunity,
  open,
  onClose,
  onApplied





}: {opportunity: OpportunityView;open: boolean;onClose: () => void;onApplied: () => void;}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const documents = useAsync(() => open ? listDocuments() : Promise.resolve([]), [open]);

  const mine = useMemo<DocumentRecord[]>(() => documents.data ?? [], [documents.data]);

  const { run, submitting, error, fieldErrors } = useMutation(async () => {
    const application = await createApplication({
      opportunityId: opportunity.id,
      coverLetter,
      documentIds: selected
    });
    toast.success(
      'Application submitted',
      `${opportunity.company.name} has been notified and will review your application.`
    );
    onApplied();
    onClose();
    navigate(`/student/applications/${application.id}`);
    return application;
  });

  const toggle = (id: string) =>
  setSelected((current) =>
  current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Apply — ${opportunity.title}`}
      description={`${opportunity.company.name} · ${opportunity.town}`}
      footer={
      <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => run()} loading={submitting}>
            Submit application
          </Button>
        </>
      }>
      
      <div className="space-y-5">
        <FormError message={error} />

        <Field
          label="Cover letter"
          htmlFor="coverLetter"
          required
          error={fieldErrors.coverLetter}
          hint="Explain why you are suited to this attachment. Minimum 60 characters.">
          
          <Textarea
            id="coverLetter"
            rows={7}
            value={coverLetter}
            invalid={!!fieldErrors.coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="I am applying for the…" />
          
        </Field>

        <div>
          <p className="text-[13px] font-medium text-navy-900">Attach documents</p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Your CV is required. Documents already approved by the attachment office are marked
            below.
          </p>
          {fieldErrors.documentIds &&
          <p className="mt-1.5 text-[12px] text-rejected-fg">{fieldErrors.documentIds}</p>
          }

          {mine.length === 0 ?
          <div className="mt-3 rounded-md border border-slate-200">
              <EmptyState
              icon={<FileTextIcon className="h-5 w-5" />}
              title="No documents uploaded"
              description="Upload your CV, introduction letter and insurance cover from the Documents page first."
              action={
              <Button size="sm" variant="secondary" onClick={() => navigate('/student/documents')}>
                    Go to documents
                  </Button>
              } />
            
            </div> :

          <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
              {mine.map((doc) =>
            <li key={doc.id} className="flex items-center gap-3 px-3.5 py-3">
                  <Checkbox
                checked={selected.includes(doc.id)}
                onChange={() => toggle(doc.id)}
                label={
                <span className="block">
                        <span className="block text-[13px] font-medium text-navy-900">
                          {label(doc.type)}
                        </span>
                        <span className="block truncate text-[12px] text-slate-500">
                          {doc.filename} · {formatBytes(doc.sizeBytes)}
                        </span>
                      </span>
                } />
              
                  <span className="ml-auto">
                    <StatusBadge status={doc.status} />
                  </span>
                </li>
            )}
            </ul>
          }
        </div>
      </div>
    </Modal>);

}