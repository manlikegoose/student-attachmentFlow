import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listSupervisors } from '../../services/directoryService';
import type { SupervisorWorkloadView } from '../../types/views';

export function CoordinatorSupervisors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const state = useAsync(() => listSupervisors(), []);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = state.data ?? [];
    if (!term) return all;
    return all.filter(
      (s) =>
      s.fullName.toLowerCase().includes(term) ||
      s.department.toLowerCase().includes(term) ||
      s.staffNumber.toLowerCase().includes(term)
    );
  }, [state.data, search]);

  return (
    <>
      <PageHeader
        title="Academic supervisors"
        description="Faculty who supervise attachés. Workload is measured against each supervisor's recommended capacity." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, department or staff number"
            label="Search supervisors" />
          
        </div>

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        rows.length > 0 ?
        <DataTable<SupervisorWorkloadView>
          caption="Academic supervisors"
          rows={rows}
          getRowKey={(s) => s.id}
          onRowClick={(s) => navigate(`/coordinator/supervisors/${s.id}`)}
          columns={[
          {
            key: 'name',
            header: 'Supervisor',
            render: (s) =>
            <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{s.fullName}</p>
                      <p className="truncate text-[12px] text-slate-500">{s.title}</p>
                    </div>
                  </div>

          },
          {
            key: 'department',
            header: 'Department',
            secondary: true,
            render: (s) => <span className="text-[13px] text-slate-600">{s.department}</span>
          },
          {
            key: 'workload',
            header: 'Workload',
            render: (s) =>
            <div className="w-40">
                    <ProgressBar
                value={Math.min(100, s.assigned / Math.max(1, s.capacity) * 100)}
                tone={s.atCapacity ? 'pending' : 'navy'}
                showValue={false}
                label={`${s.assigned} of ${s.capacity} students`} />
              
                  </div>

          },
          {
            key: 'active',
            header: 'Active',
            secondary: true,
            render: (s) => <span className="text-[13px] tabular-nums">{s.activePlacements}</span>
          },
          {
            key: 'evaluations',
            header: 'Evaluations due',
            render: (s) =>
            s.pendingEvaluations > 0 ?
            <Badge tone="pending">{s.pendingEvaluations} outstanding</Badge> :

            <span className="text-[13px] text-slate-500">None</span>

          },
          {
            key: 'capacity',
            header: '',
            align: 'right',
            render: (s) =>
            s.overCapacity ?
            <Badge tone="rejected">Over capacity</Badge> :
            s.atCapacity ?
            <Badge tone="pending">At capacity</Badge> :
            null
          }]
          }
          mobileCard={(s) =>
          <div className="flex items-start gap-3">
                <Avatar name={s.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-navy-900">{s.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{s.department}</p>
                  <div className="mt-2">
                    <ProgressBar
                  value={Math.min(100, s.assigned / Math.max(1, s.capacity) * 100)}
                  tone={s.atCapacity ? 'pending' : 'navy'}
                  showValue={false}
                  label={`${s.assigned} of ${s.capacity} students`} />
                
                  </div>
                  {s.pendingEvaluations > 0 &&
              <Badge tone="pending" className="mt-2">
                      {s.pendingEvaluations} evaluations outstanding
                    </Badge>
              }
                </div>
              </div>
          } /> :


        <EmptyState title="No supervisors match this search" />
        }
      </Card>
    </>);

}