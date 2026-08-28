import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { getStudent } from '../../services/directoryService';
import { listDocuments, reviewDocument, formatBytes } from '../../services/documentService';
import { listApplications } from '../../services/applicationService';
import { checkRequiredDocuments } from '../../domain/rules';
import { formatDate } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

export function CoordinatorStudentDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const student = useAsync(() => getStudent(id), [id]);
  const documents = useAsync(() => listDocuments({ ownerId: id }), [id]);
  const applications = useAsync(() => listApplications({ studentId: id, pageSize: 20 }), [id]);

  const [target, setTarget] = useState<{id: string;decision: 'APPROVED' | 'REJECTED';} | null>(null);
  const [comment, setComment] = useState('');

  const review = useMutation(async () => {
    await reviewDocument(target!.id, target!.decision, comment);
    toast.success(target!.decision === 'APPROVED' ? 'Document approved' : 'Document rejected');
    setTarget(null);
    setComment('');
    documents.refetch();
  });

  if (student.loading && !student.data) return <LoadingState rows={5} />;
  if (student.error || !student.data)
  return <ErrorState message={student.error ?? undefined} onRetry={student.refetch} />;

  const s = student.data;
  const readiness = checkRequiredDocuments(documents.data ?? []);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Students', to: '/coordinator/students' }, { label: s.fullName }]}
        title={s.fullName}
        description={`${s.programme} · Year ${s.yearOfStudy} · ${s.studentNumber}`}
        meta={
        readiness.ready ?
        <Badge tone="approved">Required documents approved</Badge> :

        <Badge tone="pending">
              Outstanding: {[...readiness.missing, ...readiness.unapproved].map((t) => label(t)).join(', ')}
            </Badge>

        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Documents"
              description="Approve or reject each document. Required documents must be approved before placement approval." />
            
            {documents.loading && !documents.data ?
            <LoadingState rows={3} /> :
            (documents.data?.length ?? 0) === 0 ?
            <EmptyState title="No documents uploaded" /> :

            <ul className="divide-y divide-slate-100">
                {documents.data!.map((doc) =>
              <li key={doc.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-navy-900">{label(doc.type)}</p>
                        <p className="truncate text-[12px] text-slate-500">
                          {doc.filename} · {formatBytes(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
                        </p>
                        {doc.reviewComment &&
                    <p className="mt-1 text-[12px] text-slate-600">{doc.reviewComment}</p>
                    }
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.status} />
                        {doc.status !== 'APPROVED' &&
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<CheckIcon className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setComment('');
                        setTarget({ id: doc.id, decision: 'APPROVED' });
                      }}>
                      
                            Approve
                          </Button>
                    }
                        {doc.status !== 'REJECTED' &&
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<XIcon className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setComment('');
                        setTarget({ id: doc.id, decision: 'REJECTED' });
                      }}>
                      
                            Reject
                          </Button>
                    }
                      </div>
                    </div>
                  </li>
              )}
              </ul>
            }
          </Card>

          <Card>
            <CardHeader title="Applications" description={`${applications.data?.count ?? 0} submitted`} />
            {(applications.data?.results.length ?? 0) === 0 ?
            <EmptyState title="No applications" /> :

            <ul className="divide-y divide-slate-100">
                {applications.data!.results.map((a) =>
              <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-navy-900">
                        {a.opportunity.title}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">
                        {a.company.name} · {formatDate(a.submittedAt)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
              )}
              </ul>
            }
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Student record" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={s.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">{s.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{s.email}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Student number', value: s.studentNumber },
                { label: 'Department', value: s.department },
                { label: 'Faculty', value: s.faculty },
                { label: 'Phone', value: s.phone },
                { label: 'Address', value: s.address ?? '—' },
                { label: 'Expected graduation', value: formatDate(s.expectedGraduation) },
                { label: 'Professional summary', value: s.bio ?? '—' }]
                } />
              
              {s.skills.length > 0 &&
              <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                  {s.skills.map((skill) =>
                <li key={skill}>
                      <Badge>{skill}</Badge>
                    </li>
                )}
                </ul>
              }
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.decision === 'APPROVED' ? 'Approve document' : 'Reject document'}
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={review.submitting}>
              Cancel
            </Button>
            <Button
            variant={target?.decision === 'REJECTED' ? 'danger' : 'primary'}
            loading={review.submitting}
            onClick={() => review.run()}>
            
              {target?.decision === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={review.error} />
          <Field
            label={target?.decision === 'APPROVED' ? 'Comment (optional)' : 'Reason'}
            htmlFor="comment"
            required={target?.decision === 'REJECTED'}
            error={review.fieldErrors.comment}>
            
            <Textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
              target?.decision === 'REJECTED' ?
              'Letter is unsigned and missing the departmental stamp.' :
              ''
              } />
            
          </Field>
        </div>
      </Modal>
    </>);

}