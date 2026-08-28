import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar, CompanyLogo } from '../../components/ui/Avatar';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { getStudent } from '../../services/directoryService';
import { listPlacements } from '../../services/placementService';
import { listSupervisionReports } from '../../services/supervisionService';
import { dateRange, formatDate } from '../../utils/format';
import { label } from '../../types/enums';

export function SupervisorStudentDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const student = useAsync(() => getStudent(id), [id]);
  const placements = useAsync(() => listPlacements({ studentId: id, pageSize: 5 }), [id]);
  const reports = useAsync(() => listSupervisionReports({ studentId: id, pageSize: 20 }), [id]);

  if (student.loading && !student.data) return <LoadingState rows={5} />;
  if (student.error || !student.data)
  return <ErrorState message={student.error ?? undefined} onRetry={student.refetch} />;

  const s = student.data;
  const placement = placements.data?.results[0] ?? null;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'My students', to: '/supervisor/students' }, { label: s.fullName }]}
        title={s.fullName}
        description={`${s.programme} · Year ${s.yearOfStudy} · ${s.studentNumber}`}
        meta={placement && <StatusBadge status={placement.status} />}
        actions={
        placement &&
        <Button onClick={() => navigate(`/supervisor/placements/${placement.id}`)}>
              Open placement
            </Button>

        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Supervision history"
              description={`${reports.data?.count ?? 0} report${(reports.data?.count ?? 0) === 1 ? '' : 's'}`} />
            
            {reports.loading && !reports.data ?
            <LoadingState rows={2} /> :
            (reports.data?.results.length ?? 0) === 0 ?
            <EmptyState
              title="No supervision recorded"
              description="Record a supervision visit from the placement page." /> :


            <ul className="divide-y divide-slate-100">
                {reports.data!.results.map((r) =>
              <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {label(r.type)} · {formatDate(r.date)}
                      </p>
                      {r.submitted ?
                  <Badge tone="approved">Submitted</Badge> :

                  <Badge tone="muted">Draft</Badge>
                  }
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
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
            <CardHeader title="Student record" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={s.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">{s.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{s.email}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Department', value: s.department },
                { label: 'Faculty', value: s.faculty },
                { label: 'Phone', value: s.phone },
                { label: 'Expected graduation', value: formatDate(s.expectedGraduation) }]
                } />
              
            </CardBody>
          </Card>

          {placement &&
          <Card>
              <CardHeader title="Current placement" />
              <CardBody>
                <div className="flex items-center gap-3">
                  <CompanyLogo logoText={placement.company.logoText} size="md" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-navy-900">
                      {placement.company.name}
                    </p>
                    <p className="truncate text-[12px] text-slate-500">
                      {placement.opportunity.title}
                    </p>
                  </div>
                </div>
                <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Dates', value: dateRange(placement.startDate, placement.endDate) },
                {
                  label: 'Workplace supervisor',
                  value: placement.workplaceSupervisor ?
                  placement.workplaceSupervisor.fullName :
                  'Not assigned'
                },
                {
                  label: 'Last supervision',
                  value: placement.lastSupervisionDate ?
                  formatDate(placement.lastSupervisionDate) :
                  'None recorded'
                }]
                } />
              
              </CardBody>
            </Card>
          }
        </div>
      </div>
    </>);

}