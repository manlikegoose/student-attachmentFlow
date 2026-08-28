import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar, CompanyLogo } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { getApplication, universityDecision } from '../../services/applicationService';
import { listDocuments, formatBytes } from '../../services/documentService';
import { checkRequiredDocuments } from '../../domain/rules';
import { dateRange, formatDate, formatDateTime } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

type Decision = 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

export function CoordinatorApplicationDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');

  const state = useAsync(() => getApplication(id), [id]);
  const documents = useAsync(
    () => state.data ? listDocuments({ ownerId: state.data.studentId }) : Promise.resolve([]),
    [state.data?.studentId]
  );

  const decide = useMutation(async () => {
    const result = await universityDecision(id, decision!, reason);
    toast.success(
      decision === 'APPROVE' ?
      'Placement approved' :
      decision === 'REJECT' ?
      'Application rejected' :
      'Revision requested',
      decision === 'APPROVE' ?
      'A placement record has been created. Assign an academic supervisor next.' :
      'The student has been notified.'
    );
    setDecision(null);
    setReason('');
    if (result.placementId) navigate(`/coordinator/placements/${result.placementId}`);else
    state.setData(result.application);
    return result;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const a = state.data;
  const readiness = checkRequiredDocuments(documents.data ?? []);
  const canDecide = a.status === 'UNIVERSITY_REVIEW';

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'University review', to: '/coordinator/applications' },
        { label: a.student.fullName }]
        }
        title={a.student.fullName}
        description={`${a.student.programme} · Year ${a.student.yearOfStudy} · ${a.student.studentNumber}`}
        meta={
        <>
            <StatusBadge status={a.status} />
            {readiness.ready ?
          <Badge tone="approved">Documents cleared</Badge> :

          <Badge tone="pending">Documents outstanding</Badge>
          }
          </>
        }
        actions={
        canDecide &&
        <>
              <Button
            variant="ghost"
            icon={<RotateCcwIcon className="h-3.5 w-3.5" />}
            onClick={() => setDecision('REQUEST_REVISION')}>
            
                Request revision
              </Button>
              <Button
            variant="secondary"
            icon={<XIcon className="h-3.5 w-3.5" />}
            onClick={() => setDecision('REJECT')}>
            
                Reject
              </Button>
              <Button icon={<CheckIcon className="h-4 w-4" />} onClick={() => setDecision('APPROVE')}>
                Approve placement
              </Button>
            </>

        } />
      

      {canDecide && !readiness.ready &&
      <div className="mb-5 rounded-md border border-pending-border bg-pending-bg px-4 py-3 text-[13px] text-pending-fg">
          <span className="font-semibold">Cannot approve yet.</span> Required documents outstanding:{' '}
          {[...readiness.missing, ...readiness.unapproved].map((t) => label(t)).join(', ')}. Approve
          them on the student record first.
        </div>
      }

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Cover letter" />
            <CardBody>
              <Prose text={a.coverLetter} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Student documents"
              description="The full document set on the student's record." />
            
            {(documents.data?.length ?? 0) === 0 ?
            <CardBody>
                <p className="text-[13px] text-slate-500">No documents uploaded.</p>
              </CardBody> :

            <ul className="divide-y divide-slate-100">
                {documents.data!.map((doc) =>
              <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-navy-900">{label(doc.type)}</p>
                      <p className="truncate text-[12px] text-slate-500">
                        {doc.filename} · {formatBytes(doc.sizeBytes)}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </li>
              )}
              </ul>
            }
            <CardBody className="border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/coordinator/students/${a.studentId}`)}>
                Open student record
              </Button>
            </CardBody>
          </Card>

          {(a.companyDecisionReason || a.universityDecisionReason) &&
          <Card>
              <CardHeader title="Decision history" />
              <CardBody className="space-y-4">
                {a.companyDecisionReason &&
              <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {a.company.name} · {formatDate(a.companyDecisionAt)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                      {a.companyDecisionReason}
                    </p>
                  </div>
              }
                {a.universityDecisionReason &&
              <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Attachment office · {formatDate(a.universityDecisionAt)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                      {a.universityDecisionReason}
                    </p>
                  </div>
              }
              </CardBody>
            </Card>
          }
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Student" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={a.student.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">{a.student.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{a.student.email}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Proposed placement" />
            <CardBody>
              <div className="flex items-center gap-3">
                <CompanyLogo logoText={a.company.logoText} size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy-900">{a.company.name}</p>
                  <p className="truncate text-[12px] text-slate-500">{a.company.location}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Position', value: a.opportunity.title },
                { label: 'Department', value: a.opportunity.department },
                {
                  label: 'Dates',
                  value: dateRange(a.opportunity.startDate, a.opportunity.endDate)
                },
                { label: 'Work mode', value: label(a.opportunity.workMode) },
                { label: 'Submitted', value: formatDateTime(a.submittedAt) }]
                } />
              
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={
        decision === 'APPROVE' ?
        'Approve this placement' :
        decision === 'REJECT' ?
        'Reject this application' :
        'Request a revision'
        }
        description={
        decision === 'APPROVE' ?
        'This creates the placement record and withdraws the student’s other live applications.' :
        'The student will be notified with the reason you record here.'
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={decide.submitting}>
              Cancel
            </Button>
            <Button
            variant={decision === 'REJECT' ? 'danger' : 'primary'}
            loading={decide.submitting}
            onClick={() => decide.run()}>
            
              {decision === 'APPROVE' ? 'Approve placement' : 'Confirm'}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={decide.error} />
          <Field
            label={decision === 'APPROVE' ? 'Note (optional)' : 'Reason'}
            htmlFor="reason"
            required={decision !== 'APPROVE'}
            error={decide.fieldErrors.reason}>
            
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)} />
            
          </Field>
        </div>
      </Modal>
    </>);

}