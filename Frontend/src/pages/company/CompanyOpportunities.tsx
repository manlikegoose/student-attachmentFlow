import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listOpportunities } from '../../services/opportunityService';
import { dateRange, deadlineLabel } from '../../utils/format';
import type { OpportunityView } from '../../types/views';

const PAGE_SIZE = 10;

export function CompanyOpportunities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const state = useAsync(
    () => listOpportunities({ search, page, pageSize: PAGE_SIZE }),
    [search, page]
  );

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Postings you have created. Published postings are visible to students; drafts are not."
        actions={
        <Link to="/company/opportunities/new">
            <Button icon={<PlusIcon className="h-4 w-4" />}>New opportunity</Button>
          </Link>
        } />
      

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search your postings" />
        
      </div>

      <Card>
        {state.loading && !state.data ?
        <LoadingState rows={4} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        (state.data?.results.length ?? 0) === 0 ?
        <EmptyState
          icon={<BriefcaseIcon className="h-5 w-5" />}
          title="No opportunities yet"
          description="Create a posting, then submit it to the attachment office for approval."
          action={
          <Link to="/company/opportunities/new">
                <Button size="sm">Create an opportunity</Button>
              </Link>
          } /> :


        <>
            <DataTable<OpportunityView>
            caption="My opportunities"
            rows={state.data!.results}
            getRowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/company/opportunities/${o.id}`)}
            columns={[
            {
              key: 'title',
              header: 'Opportunity',
              render: (o) =>
              <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{o.title}</p>
                      <p className="truncate text-[12px] text-slate-500">{o.department}</p>
                    </div>

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
              <span className="text-[13px] tabular-nums">
                      {o.slotsFilled}/{o.slots}
                    </span>

            },
            {
              key: 'applicants',
              header: 'Applicants',
              render: (o) => <span className="text-[13px] tabular-nums">{o.applicationCount}</span>
            },
            {
              key: 'deadline',
              header: 'Deadline',
              secondary: true,
              render: (o) =>
              <span className="text-[13px] text-slate-600">
                      {deadlineLabel(o.applicationDeadline)}
                    </span>

            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              render: (o) => <StatusBadge status={o.status} />
            }]
            }
            mobileCard={(o) =>
            <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-navy-900">
                      {o.title}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {o.slotsFilled}/{o.slots} slots · {o.applicationCount} applicants
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {deadlineLabel(o.applicationDeadline)}
                  </p>
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data!.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="opportunities" />
          
          </>
        }
      </Card>
    </>);

}