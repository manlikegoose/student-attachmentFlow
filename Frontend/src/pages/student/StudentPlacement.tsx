import React from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { RatingDisplay } from '../../components/ui/RatingInput';
import { Timeline } from '../../components/ui/Timeline';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useStudentOverview } from '../../hooks/useStudentOverview';
import { listSupervisionReports } from '../../services/supervisionService';
import { dateRange, formatDate } from '../../utils/format';
import { label } from '../../types/enums';

export function StudentPlacement() {
  const { data, loading, error, refetch } = useStudentOverview();
  const reports = useAsync(() => listSupervisionReports({ submitted: true, pageSize: 20 }), []);

  if (loading && !data) return <LoadingState rows={5} />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={refetch} />;

  const placement = data.placement;

  if (!placement) {
    return (
      <>
        <PageHeader title="My placement" description="Your confirmed attachment record." />
        <Card>
          <EmptyState
            icon={<BriefcaseIcon className="h-5 w-5" />}
            title="No placement yet"
            description="A placement record is created once the university approves an application accepted by a host organisation."
            action={
            <Link to="/student/applications">
                <Button size="sm">View my applications</Button>
              </Link>
            } />
          
        </Card>
      </>);

  }

  const evaluation = placement.evaluation;

  return (
    <>
      <PageHeader
        title="My placement"
        description={`${placement.opportunity.title} · ${placement.company.name}`}
        meta={
        <>
            <StatusBadge status={placement.status} />
            {placement.supervisionOverdue && <Badge tone="pending">Supervision overdue</Badge>}
          </>
        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Placement details" />
            <CardBody>
              <div className="flex items-start gap-3">
                <CompanyLogo logoText={placement.company.logoText} size="lg" />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-navy-900">{placement.company.name}</p>
                  <p className="text-[12px] text-slate-500">{placement.company.location}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                items={[
                { label: 'Position', value: placement.opportunity.title },
                { label: 'Department', value: placement.opportunity.department },
                { label: 'Dates', value: dateRange(placement.startDate, placement.endDate) },
                { label: 'Work mode', value: label(placement.opportunity.workMode) },
                {
                  label: 'Approved on',
                  value: formatDate(placement.approvedAt)
                },
                {
                  label: 'Completed on',
                  value: placement.completedAt ? formatDate(placement.completedAt) : '—'
                }]
                } />
              
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Supervision feedback"
              description={`${placement.supervisionCount} submitted report${placement.supervisionCount === 1 ? '' : 's'}`} />
            
            {reports.loading && !reports.data ?
            <LoadingState rows={2} /> :
            (reports.data?.results.length ?? 0) === 0 ?
            <EmptyState
              title="No supervision recorded yet"
              description="Your academic supervisor's reports appear here once submitted." /> :


            <ul className="divide-y divide-slate-100">
                {reports.data!.results.map((r) =>
              <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {label(r.type)} · {formatDate(r.date)}
                      </p>
                      <Badge tone={r.studentPresent ? 'approved' : 'pending'}>
                        {r.studentPresent ? 'Present' : 'Absent'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                      {r.progressSummary}
                    </p>
                    {r.recommendations &&
                <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
                        <span className="font-medium">Recommendations:</span> {r.recommendations}
                      </p>
                }
                  </li>
              )}
              </ul>
            }
          </Card>

          {evaluation &&
          <Card>
              <CardHeader
              title="Final evaluation"
              description={`Submitted ${formatDate(evaluation.submittedAt)}`}
              action={
              <Badge tone="approved">
                    {evaluation.finalScore.toFixed(1)} / 5 · {label(evaluation.recommendation)}
                  </Badge>
              } />
            
              <CardBody>
                <div className="space-y-0">
                  <RatingDisplay label="Technical skills" value={evaluation.scores.technicalSkills} />
                  <RatingDisplay label="Communication" value={evaluation.scores.communication} />
                  <RatingDisplay label="Teamwork" value={evaluation.scores.teamwork} />
                  <RatingDisplay label="Professionalism" value={evaluation.scores.professionalism} />
                  <RatingDisplay label="Punctuality" value={evaluation.scores.punctuality} />
                  <RatingDisplay label="Problem solving" value={evaluation.scores.problemSolving} />
                  <RatingDisplay label="Adaptability" value={evaluation.scores.adaptability} />
                  <RatingDisplay
                  label="Overall performance"
                  value={evaluation.scores.overallPerformance} />
                
                </div>
                <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Strengths', value: evaluation.strengths },
                { label: 'Areas to develop', value: evaluation.weaknesses },
                { label: 'Recommendations', value: evaluation.recommendations },
                { label: 'Overall comments', value: evaluation.overallComments }]
                } />
              
              </CardBody>
            </Card>
          }
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Attachment progress" />
            <CardBody>
              <Timeline steps={data.timeline} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Supervisors" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                {
                  label: 'Workplace supervisor',
                  value: placement.workplaceSupervisor ?
                  <>
                        <span className="block font-medium">
                          {placement.workplaceSupervisor.fullName}
                        </span>
                        <span className="block text-[12px] text-slate-500">
                          {placement.workplaceSupervisor.jobTitle} ·{' '}
                          {placement.workplaceSupervisor.email}
                        </span>
                      </> :

                  'Not yet assigned by the host organisation'

                },
                {
                  label: 'Academic supervisor',
                  value: placement.academicSupervisor ?
                  <>
                        <span className="block font-medium">
                          {placement.academicSupervisor.fullName}
                        </span>
                        <span className="block text-[12px] text-slate-500">
                          {placement.academicSupervisor.title} ·{' '}
                          {placement.academicSupervisor.email}
                        </span>
                      </> :

                  'Awaiting assignment by the attachment office'

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

          <Card>
            <CardHeader title="Progress reports" description="Your periodic check-ins" />
            <CardBody>
              <p className="text-[13px] text-slate-600">
                {placement.progressReportCount} submitted.
              </p>
              <Link to="/student/reports" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Manage progress reports
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </>);

}