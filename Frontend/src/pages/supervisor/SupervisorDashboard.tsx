import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, CalendarCheckIcon, FileTextIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listPlacements } from '../../services/placementService';
import { listProgressReports } from '../../services/supervisionService';
import { supervisorAnalytics } from '../../services/analyticsService';
import { dateRange, formatDate } from '../../utils/format';

export function SupervisorDashboard() {
  const stats = useAsync(() => supervisorAnalytics(), []);
  const overdue = useAsync(() => listPlacements({ overdueOnly: true, pageSize: 5 }), []);
  const pending = useAsync(() => listProgressReports({ awaitingFeedback: true, pageSize: 5 }), []);

  if (stats.loading && !stats.data) return <LoadingState rows={5} />;
  if (stats.error || !stats.data)
  return <ErrorState message={stats.error ?? undefined} onRetry={stats.refetch} />;

  const s = stats.data;

  return (
    <>
      <PageHeader
        title="Supervision"
        description="Students assigned to you, and what needs recording this week." />
      

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned students"
          value={s.assignedStudents}
          hint={`${s.activePlacements} currently active`}
          icon={<UsersIcon className="h-4 w-4" />}
          to="/supervisor/students" />
        
        <StatCard
          label="Overdue supervision"
          value={s.overdueSupervision}
          hint="Active placements past 30 days"
          tone={s.overdueSupervision > 0 ? 'attention' : 'default'}
          icon={<AlertTriangleIcon className="h-4 w-4" />}
          to="/supervisor/placements" />
        
        <StatCard
          label="Progress reports to answer"
          value={s.progressReportsAwaitingFeedback}
          hint="Submitted by your students"
          tone={s.progressReportsAwaitingFeedback > 0 ? 'attention' : 'default'}
          icon={<FileTextIcon className="h-4 w-4" />}
          to="/supervisor/reports" />
        
        <StatCard
          label="Evaluations outstanding"
          value={s.pendingEvaluations}
          hint={`${s.completedPlacements} placements completed`}
          icon={<CalendarCheckIcon className="h-4 w-4" />}
          to="/supervisor/evaluations" />
        
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Supervision overdue"
            description="No submitted report in the last 30 days"
            action={
            <Link to="/supervisor/placements">
                <Button variant="secondary" size="sm">
                  All placements
                </Button>
              </Link>
            } />
          
          {overdue.loading && !overdue.data ?
          <LoadingState rows={3} /> :
          (overdue.data?.results.length ?? 0) === 0 ?
          <EmptyState
            title="Supervision is up to date"
            description="Every active placement has been visited in the last 30 days." /> :


          <ul className="divide-y divide-slate-100">
              {overdue.data!.results.map((p) =>
            <li key={p.id}>
                  <Link
                to={`/supervisor/placements/${p.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                    <Avatar name={p.student.fullName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-navy-900">
                        {p.student.fullName}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {p.company.name} · {dateRange(p.startDate, p.endDate)}
                      </span>
                    </span>
                    <Badge tone="rejected">
                      {p.lastSupervisionDate ?
                  `Last ${formatDate(p.lastSupervisionDate)}` :
                  'Never visited'}
                    </Badge>
                  </Link>
                </li>
            )}
            </ul>
          }
        </Card>

        <Card>
          <CardHeader
            title="Progress reports awaiting feedback"
            description="Submitted by your students" />
          
          {pending.loading && !pending.data ?
          <LoadingState rows={3} /> :
          (pending.data?.results.length ?? 0) === 0 ?
          <EmptyState
            title="No reports waiting"
            description="You have responded to every progress report." /> :


          <ul className="divide-y divide-slate-100">
              {pending.data!.results.map((r) =>
            <li key={r.id}>
                  <Link
                to={`/supervisor/placements/${r.placementId}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-navy-900">
                        {r.student.fullName}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {dateRange(r.periodStart, r.periodEnd)} · submitted{' '}
                        {formatDate(r.submittedAt)}
                      </span>
                    </span>
                    <StatusBadge status="SUBMITTED" />
                  </Link>
                </li>
            )}
            </ul>
          }
        </Card>
      </div>
    </>);

}