import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterBar } from '../../components/ui/FilterBar';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listPlacements } from '../../services/placementService';
import { dateRange } from '../../utils/format';
import { PLACEMENT_STATUSES, label } from '../../types/enums';
import type { PlacementStatus } from '../../types/enums';

const PAGE_SIZE = 10;

const TABS = [
{ id: 'ALL', label: 'All placements' },
{ id: 'UNASSIGNED', label: 'Awaiting supervisor' },
{ id: 'OVERDUE', label: 'Supervision overdue' }];


export function CoordinatorPlacements() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search,
      status: (status || undefined) as PlacementStatus | undefined,
      unassignedOnly: tab === 'UNASSIGNED',
      overdueOnly: tab === 'OVERDUE',
      page,
      pageSize: PAGE_SIZE
    }),
    [search, status, tab, page]
  );
  const state = useAsync(() => listPlacements(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="Placements"
        description="Every approved attachment, its assigned academic supervisor, and whether supervision is up to date." />
      

      <Card>
        <div className="space-y-3 border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by student, registration number or organisation"
            label="Search placements" />
          
          <FilterBar
            onChange={(_, value) => {
              setStatus(value);
              setPage(1);
            }}
            onReset={() => {
              setStatus('');
              setPage(1);
            }}
            filters={[
            {
              key: 'status',
              label: 'Status',
              value: status,
              options: PLACEMENT_STATUSES.map((s) => ({ value: s, label: label(s) }))
            }]
            } />
          
        </div>
        <Tabs
          items={TABS}
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
            caption="Placements"
            rows={state.data.results}
            getRowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/coordinator/placements/${p.id}`)}
            columns={[
            {
              key: 'student',
              header: 'Student',
              render: (p) =>
              <div className="flex items-center gap-3">
                      <Avatar name={p.student.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy-900">{p.student.fullName}</p>
                        <p className="truncate text-[12px] text-slate-500">
                          {p.student.studentNumber}
                        </p>
                      </div>
                    </div>

            },
            {
              key: 'host',
              header: 'Host organisation',
              render: (p) =>
              <div className="min-w-0">
                      <p className="truncate text-[13px] text-navy-900">{p.company.name}</p>
                      <p className="truncate text-[12px] text-slate-500">{p.opportunity.title}</p>
                    </div>

            },
            {
              key: 'dates',
              header: 'Dates',
              secondary: true,
              render: (p) =>
              <span className="text-[13px] text-slate-600">
                      {dateRange(p.startDate, p.endDate)}
                    </span>

            },
            {
              key: 'supervisor',
              header: 'Academic supervisor',
              render: (p) =>
              p.academicSupervisor ?
              <span className="text-[13px] text-slate-700">
                        {p.academicSupervisor.fullName}
                      </span> :

              <Badge tone="pending">Unassigned</Badge>

            },
            {
              key: 'supervision',
              header: 'Supervision',
              secondary: true,
              render: (p) =>
              p.supervisionOverdue ?
              <Badge tone="rejected">Overdue</Badge> :

              <span className="text-[13px] text-slate-600">{p.supervisionCount} visits</span>

            },
            { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} /> }]
            }
            mobileCard={(p) =>
            <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-navy-900">
                        {p.student.fullName}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">{p.company.name}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {!p.academicSupervisor && <Badge tone="pending">Unassigned</Badge>}
                    {p.supervisionOverdue && <Badge tone="rejected">Supervision overdue</Badge>}
                  </div>
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="placements" />
          
          </> :

        <EmptyState
          title="No placements match these filters"
          description="Placements are created when the attachment office approves an accepted application." />

        }
      </Card>
    </>);

}