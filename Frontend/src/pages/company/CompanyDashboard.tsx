import React from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  PlusIcon,
  ShieldAlertIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { ChartCard, CHART_COLORS, chartAxisProps, chartTooltipStyle } from '../../components/ui/ChartCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { companyAnalytics } from '../../services/analyticsService';
import { getMyCompanyProfile } from '../../services/directoryService';
import { listApplications } from '../../services/applicationService';
import { formatDate } from '../../utils/format';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function CompanyDashboard() {
  const profile = useAsync(() => getMyCompanyProfile(), []);
  const stats = useAsync(() => companyAnalytics(), []);
  const queue = useAsync(
    () => listApplications({ status: 'SUBMITTED', pageSize: 5 }),
    []
  );

  if (profile.loading && !profile.data) return <LoadingState rows={5} />;
  if (profile.error || !profile.data)
  return <ErrorState message={profile.error ?? undefined} onRetry={profile.refetch} />;

  const company = profile.data;
  const verified = company.verificationStatus === 'VERIFIED';

  return (
    <>
      <PageHeader
        title={company.name}
        description={`${company.industry} · ${company.location}`}
        meta={<VerificationBadge status={company.verificationStatus} />}
        actions={
        <Link to="/company/opportunities/new">
            <Button icon={<PlusIcon className="h-4 w-4" />}>New opportunity</Button>
          </Link>
        } />
      

      {!verified &&
      <div className="mb-6 flex flex-wrap items-start gap-3 rounded-lg border border-pending-border bg-pending-bg px-4 py-3.5">
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-pending-fg" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-pending-fg">
              {company.verificationStatus === 'PENDING_VERIFICATION' ?
            'Verification in progress' :
            'Verification required'}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-pending-fg">
              Opportunities cannot be published until the university attachment office verifies
              your organisation.
            </p>
          </div>
          <Link to="/company/profile">
            <Button size="sm" variant="secondary">
              Manage verification
            </Button>
          </Link>
        </div>
      }

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pending reviews"
          value={stats.data?.pendingReviews ?? '—'}
          hint="Applicants awaiting your decision"
          tone={(stats.data?.pendingReviews ?? 0) > 0 ? 'attention' : 'default'}
          icon={<ClipboardListIcon className="h-4 w-4" />}
          to="/company/applications"
          loading={stats.loading} />
        
        <StatCard
          label="Active opportunities"
          value={stats.data?.activeOpportunities ?? '—'}
          hint="Published and open"
          icon={<BriefcaseIcon className="h-4 w-4" />}
          to="/company/opportunities"
          loading={stats.loading} />
        
        <StatCard
          label="Total applicants"
          value={stats.data?.totalApplicants ?? '—'}
          hint={`${stats.data?.acceptedStudents ?? 0} accepted`}
          icon={<UsersIcon className="h-4 w-4" />}
          loading={stats.loading} />
        
        <StatCard
          label="Active interns"
          value={stats.data?.activeInterns ?? '—'}
          hint="Currently on attachment"
          icon={<GraduationCapIcon className="h-4 w-4" />}
          to="/company/students"
          loading={stats.loading} />
        
        <StatCard
          label="Completed attachments"
          value={stats.data?.completedInternships ?? '—'}
          hint="Across all cycles"
          loading={stats.loading} />
        
        <StatCard
          label="Verification"
          value={verified ? 'Verified' : 'Pending'}
          hint={verified ? 'You can publish opportunities' : 'Awaiting the attachment office'}
          tone={verified ? 'default' : 'attention'}
          to="/company/profile" />
        
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Applicants awaiting review"
            description="Newest first"
            action={
            <Link to="/company/applications">
                <Button variant="secondary" size="sm">
                  View all
                </Button>
              </Link>
            } />
          
          {queue.loading && !queue.data ?
          <LoadingState rows={3} /> :
          (queue.data?.results.length ?? 0) === 0 ?
          <EmptyState
            title="No applications waiting"
            description="New applications appear here as soon as students submit them." /> :


          <ul className="divide-y divide-slate-100">
              {queue.data!.results.map((a) =>
            <li key={a.id}>
                  <Link
                to={`/company/applications/${a.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                    <Avatar name={a.student.fullName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-navy-900">
                        {a.student.fullName}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {a.opportunity.title} · {formatDate(a.submittedAt)}
                      </span>
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
            )}
            </ul>
          }
        </Card>

        <ChartCard
          title="Applications per opportunity"
          question="Which postings are attracting candidates, and which need promoting?"
          hasData={(stats.data?.applicationsPerOpportunity.length ?? 0) > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.data?.applicationsPerOpportunity ?? []}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" {...chartAxisProps} interval={0} height={50} />
              <YAxis allowDecimals={false} {...chartAxisProps} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" name="Applications" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>);

}