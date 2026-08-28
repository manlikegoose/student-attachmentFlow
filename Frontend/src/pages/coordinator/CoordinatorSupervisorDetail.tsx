import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listSupervisors } from '../../services/directoryService';
import { listPlacements } from '../../services/placementService';
import { listSupervisionReports } from '../../services/supervisionService';
import { dateRange, formatDate } from '../../utils/format';
import { label } from '../../types/enums';
import { notFound } from '../../types/api';

export function CoordinatorSupervisorDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const state = useAsync(async () => {
    const all = await listSupervisors();
    const found = all.find((s) => s.id === id);
    if (!found) throw notFound('Supervisor not found.');
    return found;
  }, [id]);
  const placements = useAsync(() => listPlacements({ supervisorId: id, pageSize: 50 }), [id]);
  const reports = useAsync(
    () => listSupervisionReports({ supervisorId: id, submitted: true, pageSize: 10 }),
    [id]
  );

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const s = state.data;
  const rows = placements.data?.results ?? [];

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'Academic supervisors', to: '/coordinator/supervisors' },
        { label: s.fullName }]
        }
        title={s.fullName}
        description={`${s.title} · ${s.department}`}
        meta={
        <>
            <Badge tone={s.atCapacity ? 'pending' : 'neutral'}>
              {s.assigned} of {s.capacity} students
            </Badge>
            {s.pendingEvaluations > 0 &&
          <Badge tone="pending">{s.pendingEvaluations} evaluations due</Badge>
          }
          </>
        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Assigned students"
              description="Placements this supervisor is responsible for" />
            
            {placements.loading && !placements.data ?
            <LoadingState rows={3} /> :
            rows.length === 0 ?
            <EmptyState
              title="No students assigned"
              description="Assign students from a placement record." /> :


            <ul className="divide-y divide-slate-100">
                {rows.map((p) =>
              <li key={p.id}>
                    <button
                  type="button"
                  onClick={() => navigate(`/coordinator/placements/${p.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 ease-smooth hover:bg-slate-50">
                  
                      <Avatar name={p.student.fullName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-navy-900">
                          {p.student.fullName}
                        </span>
                        <span className="block truncate text-[12px] text-slate-500">
                          {p.company.name} · {dateRange(p.startDate, p.endDate)}
                        </span>
                      </span>
                      {p.supervisionOverdue && <Badge tone="rejected">Overdue</Badge>}
                      <StatusBadge status={p.status} />
                    </button>
                  </li>
              )}
              </ul>
            }
          </Card>

          <Card>
            <CardHeader title="Recent supervision reports" />
            {(reports.data?.results.length ?? 0) === 0 ?
            <EmptyState title="No submitted reports" /> :

            <ul className="divide-y divide-slate-100">
                {reports.data!.results.map((r) =>
              <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {r.student.fullName}
                      </p>
                      <span className="text-[12px] text-slate-500">
                        {label(r.type)} · {formatDate(r.date)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
                      {r.progressSummary}
                    </p>
                  </li>
              )}
              </ul>
            }
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Supervisor record" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={s.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">{s.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{s.email}</p>
                </div>
              </div>
              <div className="mt-5">
                <ProgressBar
                  value={Math.min(100, s.assigned / Math.max(1, s.capacity) * 100)}
                  tone={s.atCapacity ? 'pending' : 'navy'}
                  showValue={false}
                  label={`Workload: ${s.assigned} of ${s.capacity}`} />
                
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Staff number', value: s.staffNumber },
                { label: 'Department', value: s.department },
                { label: 'Faculty', value: s.faculty },
                { label: 'Phone', value: s.phone },
                { label: 'Specialisation', value: s.specialisation ?? '—' }]
                } />
              
            </CardBody>
          </Card>
        </div>
      </div>
    </>);

}