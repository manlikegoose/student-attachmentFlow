import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileWarningIcon,
  SearchIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { CompanyLogo } from '../../components/ui/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useStudentOverview } from '../../hooks/useStudentOverview';
import { useAsync } from '../../hooks/useAsync';
import { listOpportunities } from '../../services/opportunityService';
import { dateRange, deadlineLabel, formatDate } from '../../utils/format';
import { ACTIVE_APPLICATION_STATUSES } from '../../domain/rules';

export function StudentDashboard() {
  const { data, loading, error, refetch } = useStudentOverview();
  const deadlines = useAsync(() => listOpportunities({ pageSize: 4 }), []);

  if (loading && !data) return <LoadingState rows={6} />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={refetch} />;

  const { profile, applications, placement, completion, documents } = data;
  const pending = applications.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status));
  const accepted = applications.filter((a) =>
  ['COMPANY_ACCEPTED', 'UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(a.status)
  );
  const pendingDocs = documents.filter((d) => d.status === 'PENDING').length;
  const rejectedDocs = documents.filter((d) => d.status === 'REJECTED').length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.fullName.split(' ')[0]}`}
        description={`${profile.programme} · Year ${profile.yearOfStudy} · ${profile.studentNumber}`}
        actions={
        !placement &&
        <Link to="/student/opportunities">
              <Button icon={<SearchIcon className="h-4 w-4" />}>Find opportunities</Button>
            </Link>

        } />
      

      {/* The placement — or the path to one — is what this screen is for. */}
      {placement ?
      <Card className="mb-6">
          <CardHeader
          title="Current attachment"
          description="Your active placement record"
          action={
          <Link to="/student/placement">
                <Button variant="secondary" size="sm" icon={<ArrowRightIcon className="h-3.5 w-3.5" />}>
                  Open placement
                </Button>
              </Link>
          } />
        
          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <div className="flex items-start gap-3">
                <CompanyLogo logoText={placement.company.logoText} size="lg" />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight text-navy-900">
                    {placement.opportunity.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-slate-600">{placement.company.name}</p>
                  <div className="mt-2">
                    <StatusBadge status={placement.status} />
                  </div>
                </div>
              </div>

              <DescriptionList
              className="mt-6"
              items={[
              { label: 'Dates', value: dateRange(placement.startDate, placement.endDate) },
              { label: 'Location', value: `${placement.company.location}` },
              {
                label: 'Workplace supervisor',
                value: placement.workplaceSupervisor ?
                `${placement.workplaceSupervisor.fullName} · ${placement.workplaceSupervisor.jobTitle}` :
                'Not yet assigned'
              },
              {
                label: 'Academic supervisor',
                value: placement.academicSupervisor ?
                `${placement.academicSupervisor.fullName} · ${placement.academicSupervisor.title}` :
                'Awaiting assignment by the attachment office'
              }]
              } />
            
            </div>

            <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Attachment progress
              </p>
              <Timeline steps={data.timeline} />
            </div>
          </div>
        </Card> :

      <Card className="mb-6">
          <CardHeader title="Attachment progress" description="Your path to a confirmed placement" />
          <div className="grid gap-6 p-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <Timeline steps={data.timeline} />
            <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {applications.length === 0 ?
            <EmptyState
              icon={<BriefcaseIcon className="h-5 w-5" />}
              title="You have not applied yet"
              description="Browse published opportunities from verified host organisations and submit your first application."
              action={
              <Link to="/student/opportunities">
                      <Button size="sm">Find opportunities</Button>
                    </Link>
              } /> :


            <>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Live applications
                  </p>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {applications.slice(0, 4).map((a) =>
                <li key={a.id}>
                        <Link
                    to={`/student/applications/${a.id}`}
                    className="flex items-center gap-3 py-3 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                    
                          <CompanyLogo logoText={a.company.logoText} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-navy-900">
                              {a.opportunity.title}
                            </span>
                            <span className="block truncate text-[12px] text-slate-500">
                              {a.company.name} · applied {formatDate(a.submittedAt)}
                            </span>
                          </span>
                          <StatusBadge status={a.status} />
                        </Link>
                      </li>
                )}
                  </ul>
                </>
            }
            </div>
          </div>
        </Card>
      }

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={applications.length}
          hint={`${pending.length} awaiting a decision`}
          icon={<ClipboardListIcon className="h-4 w-4" />}
          to="/student/applications" />
        
        <StatCard
          label="Accepted"
          value={accepted.length}
          hint="Company or university approved"
          icon={<BriefcaseIcon className="h-4 w-4" />} />
        
        <StatCard
          label="Documents to resolve"
          value={pendingDocs + rejectedDocs}
          hint={`${pendingDocs} pending review, ${rejectedDocs} rejected`}
          tone={rejectedDocs > 0 ? 'attention' : 'default'}
          icon={<FileWarningIcon className="h-4 w-4" />}
          to="/student/documents" />
        
        <StatCard
          label="Profile completion"
          value={`${completion.percent}%`}
          hint={
          completion.percent === 100 ?
          'Your profile is complete' :
          `${completion.items.filter((i) => !i.done).length} items outstanding`
          }
          tone={completion.percent < 100 ? 'attention' : 'default'}
          to="/student/profile" />
        
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Complete your profile"
            description="Host organisations and the attachment office review this before approving a placement."
            action={
            <Link to="/student/profile">
                <Button variant="secondary" size="sm">
                  Edit profile
                </Button>
              </Link>
            } />
          
          <CardBody>
            <ProgressBar
              value={completion.percent}
              label="Profile completion"
              tone={completion.percent === 100 ? 'approved' : 'navy'} />
            
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {completion.items.map((item) =>
              <li
                key={item.label}
                className="flex items-center gap-2 text-[13px] text-slate-700">
                
                  <span
                  className={
                  item.done ?
                  'h-1.5 w-1.5 rounded-full bg-approved-solid' :
                  'h-1.5 w-1.5 rounded-full bg-slate-300'
                  }
                  aria-hidden />
                
                  <span className={item.done ? 'text-slate-500 line-through' : ''}>
                    {item.label}
                  </span>
                </li>
              )}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming deadlines"
            description="Published opportunities closing soonest"
            action={
            <Link to="/student/opportunities">
                <Button variant="secondary" size="sm">
                  View all
                </Button>
              </Link>
            } />
          
          {deadlines.data && deadlines.data.results.length > 0 ?
          <ul className="divide-y divide-slate-100">
              {deadlines.data.results.map((o) =>
            <li key={o.id}>
                  <Link
                to={`/student/opportunities/${o.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                    <CalendarClockIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-navy-900">
                        {o.title}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {o.company.name} · {o.town}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-medium text-pending-fg">
                      {deadlineLabel(o.applicationDeadline)}
                    </span>
                  </Link>
                </li>
            )}
            </ul> :

          <EmptyState title="No open opportunities" description="Check back when the next cycle opens." />
          }
        </Card>
      </div>
    </>);

}