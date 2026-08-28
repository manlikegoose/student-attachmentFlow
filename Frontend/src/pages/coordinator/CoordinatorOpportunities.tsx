import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { decideApproval, listOpportunities } from '../../services/opportunityService';
import { useToast } from '../../contexts/ToastContext';
import { dateRange, deadlineLabel } from '../../utils/format';
import { label } from '../../types/enums';
import type { OpportunityStatus } from '../../types/enums';
import type { OpportunityView } from '../../types/views';

const PAGE_SIZE = 10;

const TABS: {id: string;label: string;status?: OpportunityStatus;}[] = [
{ id: 'PENDING_APPROVAL', label: 'Awaiting approval', status: 'PENDING_APPROVAL' },
{ id: 'PUBLISHED', label: 'Published', status: 'PUBLISHED' },
{ id: 'CLOSED', label: 'Closed', status: 'CLOSED' },
{ id: 'ALL', label: 'All postings' }];


export function CoordinatorOpportunities() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<OpportunityView | null>(null);
  const [note, setNote] = useState('');

  const status = TABS.find((t) => t.id === tab)?.status;
  const query = useMemo(
    () => ({ status, search, page, pageSize: PAGE_SIZE, includeAllStatuses: true }),
    [status, search, page]
  );
  const state = useAsync(() => listOpportunities(query), [JSON.stringify(query)]);

  const decide = useMutation(async (decision: 'APPROVE' | 'REJECT') => {
    if (!reviewing) return null;
    const result = await decideApproval(reviewing.id, decision, note);
    toast.success(
      decision === 'APPROVE' ? 'Opportunity published' : 'Opportunity returned to the organisation',
      decision === 'APPROVE' ?
      `“${result.title}” is now open to students.` :
      'The host organisation has been notified.'
    );
    setReviewing(null);
    setNote('');
    state.refetch();
    return result;
  });

  return (
    <>
      <PageHeader
        title="Opportunity approval"
        description="Postings submitted by verified host organisations. Only approved postings become visible to students." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by title, organisation or department"
            label="Search opportunities" />
          
        </div>
        <Tabs
          items={TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={tab}
          onChange={(id) => {
            setTab(id);
            setPage(1);
          }}
          className="px-4" />
        

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <>
            <DataTable
            caption="Opportunity postings"
            rows={state.data.results}
            getRowKey={(o) => o.id}
            columns={[
            {
              key: 'title',
              header: 'Posting',
              render: (o) =>
              <div className="flex items-center gap-3">
                      <CompanyLogo logoText={o.company.logoText} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy-900">{o.title}</p>
                        <p className="truncate text-[12px] text-slate-500">{o.company.name}</p>
                      </div>
                    </div>

            },
            {
              key: 'verification',
              header: 'Organisation',
              secondary: true,
              render: (o) => <VerificationBadge status={o.company.verificationStatus} />
            },
            {
              key: 'dates',
              header: 'Dates',
              secondary: true,
              render: (o) =>
              <span className="text-[13px] text-slate-600">
                      {dateRange(o.startDate, o.endDate)}
                    </span>

            },
            {
              key: 'slots',
              header: 'Slots',
              render: (o) =>
              <span className="tabular-nums text-[13px] text-slate-600">
                      {o.slotsFilled}/{o.slots}
                    </span>

            },
            {
              key: 'status',
              header: 'Status',
              render: (o) => <StatusBadge status={o.status} />
            },
            {
              key: 'action',
              header: '',
              align: 'right',
              render: (o) =>
              o.status === 'PENDING_APPROVAL' ?
              <Button size="sm" onClick={() => setReviewing(o)}>
                        Review
                      </Button> :

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/opportunities/${o.id}`)}>
                
                        View
                      </Button>

            }]
            }
            mobileCard={(o) =>
            <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-navy-900">{o.title}</p>
                      <p className="truncate text-[12px] text-slate-500">{o.company.name}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-2 text-[12px] text-slate-500">
                    {label(o.workMode)} · {o.town} · {deadlineLabel(o.applicationDeadline)}
                  </p>
                  {o.status === 'PENDING_APPROVAL' &&
              <Button size="sm" className="mt-3" onClick={() => setReviewing(o)}>
                      Review posting
                    </Button>
              }
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="postings" />
          
          </> :

        <EmptyState
          title="Nothing in this queue"
          description="Postings appear here once a verified organisation submits them for approval." />

        }
      </Card>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={reviewing?.title ?? ''}
        description={reviewing ? `${reviewing.company.name} · ${reviewing.department}` : undefined}
        size="lg"
        footer={
        <>
            <Button
            variant="danger"
            loading={decide.submitting}
            onClick={() => decide.run('REJECT')}>
            
              Return for revision
            </Button>
            <Button loading={decide.submitting} onClick={() => decide.run('APPROVE')}>
              Approve and publish
            </Button>
          </>
        }>
        
        {reviewing &&
        <div className="space-y-4">
            <FormError message={decide.error} />
            <p className="text-[13px] leading-relaxed text-slate-700">{reviewing.description}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-[12px]">
              <div>
                <dt className="text-slate-500">Dates</dt>
                <dd className="text-navy-900">
                  {dateRange(reviewing.startDate, reviewing.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Slots</dt>
                <dd className="text-navy-900">{reviewing.slots}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Work mode</dt>
                <dd className="text-navy-900">{label(reviewing.workMode)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Deadline</dt>
                <dd className="text-navy-900">{deadlineLabel(reviewing.applicationDeadline)}</dd>
              </div>
            </dl>
            <Field
            label="Reviewer note"
            htmlFor="note"
            error={decide.fieldErrors.note}
            hint="Required when returning a posting for revision.">
            
              <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the host organisation…" />
            
            </Field>
          </div>
        }
      </Modal>
    </>);

}