import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PencilIcon, SendIcon, XCircleIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  closeOpportunity,
  getOpportunity,
  submitForApproval } from
'../../services/opportunityService';
import { listApplications } from '../../services/applicationService';
import { dateRange, deadlineLabel, formatDate } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';

export function CompanyOpportunityDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useAsync(() => getOpportunity(id), [id]);
  const applicants = useAsync(() => listApplications({ opportunityId: id, pageSize: 20 }), [id]);

  const submit = useMutation(async () => {
    const updated = await submitForApproval(id);
    state.setData(updated);
    toast.success('Submitted for approval');
    return updated;
  });

  const close = useMutation(async () => {
    const updated = await closeOpportunity(id);
    state.setData(updated);
    toast.success('Opportunity closed');
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const o = state.data;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Opportunities', to: '/company/opportunities' }, { label: o.title }]}
        title={o.title}
        description={`${o.department} · ${o.location}`}
        meta={
        <>
            <StatusBadge status={o.status} />
            <Badge tone="muted">{deadlineLabel(o.applicationDeadline)}</Badge>
            <Badge tone="neutral">
              {o.slotsFilled}/{o.slots} slots filled
            </Badge>
          </>
        }
        actions={
        <>
            {['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED'].includes(o.status) &&
          <Link to={`/company/opportunities/${o.id}/edit`}>
                <Button variant="secondary" icon={<PencilIcon className="h-3.5 w-3.5" />}>
                  Edit
                </Button>
              </Link>
          }
            {o.status === 'DRAFT' &&
          <Button
            icon={<SendIcon className="h-3.5 w-3.5" />}
            loading={submit.submitting}
            onClick={() => submit.run()}>
            
                Submit for approval
              </Button>
          }
            {o.status === 'PUBLISHED' &&
          <Button
            variant="secondary"
            icon={<XCircleIcon className="h-3.5 w-3.5" />}
            loading={close.submitting}
            onClick={() => close.run()}>
            
                Close posting
              </Button>
          }
          </>
        } />
      

      {(submit.error || close.error) &&
      <div className="mb-5 rounded-md border border-rejected-border bg-rejected-bg px-4 py-3 text-[13px] text-rejected-fg">
          {submit.error ?? close.error}
        </div>
      }

      {o.reviewNote && o.status === 'DRAFT' &&
      <div className="mb-5 rounded-md border border-pending-border bg-pending-bg px-4 py-3 text-[13px] text-pending-fg">
          <span className="font-semibold">Returned by the attachment office:</span> {o.reviewNote}
        </div>
      }

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <Prose text={o.description} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Applicants"
              description={`${o.applicationCount} received`}
              action={
              <Link to="/company/applications">
                  <Button variant="secondary" size="sm">
                    Review all
                  </Button>
                </Link>
              } />
            
            {applicants.loading && !applicants.data ?
            <LoadingState rows={3} /> :
            (applicants.data?.results.length ?? 0) === 0 ?
            <EmptyState
              title="No applicants yet"
              description="Applications appear here as soon as students submit them." /> :


            <ul className="divide-y divide-slate-100">
                {applicants.data!.results.map((a) =>
              <li key={a.id}>
                    <button
                  type="button"
                  onClick={() => navigate(`/company/applications/${a.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 ease-smooth hover:bg-slate-50">
                  
                      <Avatar name={a.student.fullName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-navy-900">
                          {a.student.fullName}
                        </span>
                        <span className="block truncate text-[12px] text-slate-500">
                          {a.student.programme} · Year {a.student.yearOfStudy}
                        </span>
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
              )}
              </ul>
            }
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Posting details" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                { label: 'Dates', value: dateRange(o.startDate, o.endDate) },
                { label: 'Duration', value: `${o.durationWeeks} weeks` },
                { label: 'Work mode', value: label(o.workMode) },
                { label: 'Application deadline', value: formatDate(o.applicationDeadline) },
                { label: 'Created', value: formatDate(o.createdAt) },
                {
                  label: 'Published',
                  value: o.publishedAt ? formatDate(o.publishedAt) : 'Not published'
                }]
                } />
              
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Requirements" />
            <CardBody>
              <ul className="space-y-2">
                {o.requirements.map((r) =>
                <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-400" aria-hidden />
                    {r}
                  </li>
                )}
              </ul>
              {o.preferredSkills.length > 0 &&
              <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                  {o.preferredSkills.map((s) =>
                <li key={s}>
                      <Badge>{s}</Badge>
                    </li>
                )}
                </ul>
              }
            </CardBody>
          </Card>
        </div>
      </div>
    </>);

}