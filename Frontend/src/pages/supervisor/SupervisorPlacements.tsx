import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listPlacements } from '../../services/placementService';
import { dateRange, formatDate } from '../../utils/format';

const TABS = [
{ id: 'ALL', label: 'All placements' },
{ id: 'OVERDUE', label: 'Supervision overdue' }];


export function SupervisorPlacements() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const query = useMemo(
    () => ({ search, overdueOnly: tab === 'OVERDUE', pageSize: 50 }),
    [search, tab]
  );
  const state = useAsync(() => listPlacements(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="Placements"
        description="Record supervision visits and monitor the students under your care." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by student or host organisation"
            label="Search placements" />
          
        </div>
        <Tabs items={TABS} active={tab} onChange={setTab} className="px-4" />

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <DataTable
          caption="Placements"
          rows={state.data.results}
          getRowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/supervisor/placements/${p.id}`)}
          columns={[
          {
            key: 'student',
            header: 'Student',
            render: (p) =>
            <div className="flex items-center gap-3">
                    <Avatar name={p.student.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{p.student.fullName}</p>
                      <p className="truncate text-[12px] text-slate-500">{p.student.programme}</p>
                    </div>
                  </div>

          },
          {
            key: 'host',
            header: 'Host organisation',
            render: (p) =>
            <div className="min-w-0">
                    <p className="truncate text-[13px] text-navy-900">{p.company.name}</p>
                    <p className="truncate text-[12px] text-slate-500">{p.opportunity.town}</p>
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
            key: 'visits',
            header: 'Visits',
            render: (p) =>
            p.supervisionOverdue ?
            <Badge tone="rejected">Overdue</Badge> :

            <span className="text-[13px] text-slate-600">
                      {p.supervisionCount} ·{' '}
                      {p.lastSupervisionDate ? formatDate(p.lastSupervisionDate) : 'none'}
                    </span>

          },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          {
            key: 'action',
            header: '',
            align: 'right',
            render: (p) =>
            <Button size="sm" onClick={() => navigate(`/supervisor/placements/${p.id}`)}>
                    Open
                  </Button>

          }]
          }
          mobileCard={(p) =>
          <div className="flex items-start gap-3">
                <Avatar name={p.student.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-navy-900">
                    {p.student.fullName}
                  </p>
                  <p className="truncate text-[12px] text-slate-500">{p.company.name}</p>
                  {p.supervisionOverdue &&
              <Badge tone="rejected" className="mt-1.5">
                      Supervision overdue
                    </Badge>
              }
                </div>
                <StatusBadge status={p.status} />
              </div>
          } /> :


        <EmptyState
          title="Nothing in this list"
          description="Placements appear here once the attachment office assigns students to you." />

        }
      </Card>
    </>);

}