import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { Timeline } from '../../components/ui/Timeline';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { getApplication, withdrawApplication } from '../../services/applicationService';
import { buildLifecycleTimeline, canTransitionApplication } from '../../domain/rules';
import { formatDate, formatDateTime, dateRange } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

export function StudentApplicationDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const state = useAsync(() => getApplication(id), [id]);

  const withdraw = useMutation(async () => {
    const updated = await withdrawApplication(id);
    state.setData(updated);
    setConfirm(false);
    toast.success('Application withdrawn');
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const a = state.data;
  const canWithdraw = canTransitionApplication(a.status, 'WITHDRAWN');
  const timeline = buildLifecycleTimeline(a, null, false, false);

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'My applications', to: '/student/applications' },
        { label: a.opportunity.title }]
        }
        title={a.opportunity.title}
        description={`${a.company.name} · ${a.opportunity.town} · ${label(a.opportunity.workMode)}`}
        meta={<StatusBadge status={a.status} />}
        actions={
        canWithdraw &&
        <Button variant="secondary" onClick={() => setConfirm(true)}>
              Withdraw application
            </Button>

        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Your cover letter" />
            <CardBody>
              <Prose text={a.coverLetter} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Attached documents" description={`${a.documents.length} attached`} />
            {a.documents.length === 0 ?
            <CardBody>
                <p className="text-[13px] text-slate-500">No documents were attached.</p>
              </CardBody> :

            <ul className="divide-y divide-slate-100">
                {a.documents.map((doc) =>
              <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-navy-900">{label(doc.type)}</p>
                      <p className="truncate text-[12px] text-slate-500">{doc.filename}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </li>
              )}
              </ul>
            }
          </Card>

          {(a.companyDecisionReason || a.universityDecisionReason) &&
          <Card>
              <CardHeader title="Decisions" />
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
            <CardHeader title="Progress" />
            <CardBody>
              <Timeline steps={timeline} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Application details" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                { label: 'Submitted', value: formatDateTime(a.submittedAt) },
                { label: 'Last updated', value: formatDateTime(a.updatedAt) },
                { label: 'Department', value: a.opportunity.department },
                {
                  label: 'Placement dates',
                  value: dateRange(a.opportunity.startDate, a.opportunity.endDate)
                }]
                } />
              
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Withdraw this application?"
        message="The host organisation and the attachment office will no longer consider it. You can apply again to the same opportunity while it remains open."
        confirmLabel="Withdraw"
        destructive
        loading={withdraw.submitting}
        onCancel={() => setConfirm(false)}
        onConfirm={() => withdraw.run()} />
      
    </>);

}