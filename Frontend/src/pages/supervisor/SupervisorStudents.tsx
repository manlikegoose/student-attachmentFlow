import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listPlacements } from '../../services/placementService';
import { dateRange, formatDate } from '../../utils/format';

export function SupervisorStudents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const state = useAsync(() => listPlacements({ search, pageSize: 50 }), [search]);

  return (
    <>
      <PageHeader
        title="My students"
        description="Students assigned to you for academic supervision, across all cycles." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by student name or host organisation"
            label="Search students" />
          
        </div>

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <DataTable
          caption="Assigned students"
          rows={state.data.results}
          getRowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/supervisor/students/${p.studentId}`)}
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
            key: 'supervision',
            header: 'Last supervision',
            render: (p) =>
            p.supervisionOverdue ?
            <Badge tone="rejected">Overdue</Badge> :

            <span className="text-[13px] text-slate-600">
                      {p.lastSupervisionDate ? formatDate(p.lastSupervisionDate) : 'None'}
                    </span>

          },
          { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} /> }]
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
          title="No students assigned"
          description="The attachment office assigns students to you when it approves their placement." />

        }
      </Card>
    </>);

}