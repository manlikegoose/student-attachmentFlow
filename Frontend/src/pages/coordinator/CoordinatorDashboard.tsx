import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  Building2Icon,
  ClipboardCheckIcon,
  FileTextIcon,
  UsersIcon } from
'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import {
  ChartCard,
  CHART_COLORS,
  CHART_SERIES,
  chartAxisProps,
  chartTooltipStyle } from
'../../components/ui/ChartCard';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { coordinatorAnalytics } from '../../services/analyticsService';
import { label } from '../../types/enums';

export function CoordinatorDashboard() {
  const state = useAsync(() => coordinatorAnalytics(), []);

  if (state.loading && !state.data) return <LoadingState rows={6} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const { totals, queues, completionRate } = state.data;

  const actionQueues = [
  {
    label: 'Companies awaiting verification',
    count: queues.companyVerification,
    to: '/coordinator/companies',
    icon: Building2Icon
  },
  {
    label: 'Applications awaiting university review',
    count: queues.universityReview,
    to: '/coordinator/applications',
    icon: ClipboardCheckIcon
  },
  {
    label: 'Opportunities awaiting approval',
    count: queues.opportunityApproval,
    to: '/coordinator/opportunities',
    icon: BriefcaseIcon
  },
  {
    label: 'Placements without a supervisor',
    count: queues.unassignedSupervisor,
    to: '/coordinator/placements',
    icon: UsersIcon
  },
  {
    label: 'Documents awaiting review',
    count: queues.documentReview,
    to: '/coordinator/students',
    icon: FileTextIcon
  },
  {
    label: 'Placements with overdue supervision',
    count: totals.overdueSupervision,
    to: '/coordinator/placements',
    icon: AlertTriangleIcon
  }];


  return (
    <>
      <PageHeader
        title="Attachment programme"
        description="What needs your decision today, followed by the state of the programme." />
      

      {/* Action queues outrank the totals: this is what a coordinator opens the app to do. */}
      <Card className="mb-6">
        <CardHeader title="Needs your attention" description="Open queues across the workflow" />
        <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
          {actionQueues.map((q) =>
          <li key={q.label} className="sm:border-b sm:border-slate-100">
              <Link
              to={q.to}
              className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 ease-smooth hover:bg-slate-50">
              
                <span
                className={
                q.count > 0 ?
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pending-bg text-pending-fg' :
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400'
                }>
                
                  <q.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[13px] text-navy-900">{q.label}</span>
                <span
                className={
                q.count > 0 ?
                'text-lg font-semibold tabular-nums text-pending-fg' :
                'text-lg font-semibold tabular-nums text-slate-300'
                }>
                
                  {q.count}
                </span>
              </Link>
            </li>
          )}
        </ul>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={totals.students}
          hint="Registered on the programme"
          to="/coordinator/students" />
        
        <StatCard
          label="Companies"
          value={totals.companies}
          hint={`${totals.verifiedCompanies} verified, ${totals.pendingVerification} pending`}
          to="/coordinator/companies" />
        
        <StatCard
          label="Active opportunities"
          value={totals.activeOpportunities}
          hint={`${totals.applications} applications received`}
          to="/coordinator/opportunities" />
        
        <StatCard
          label="Active placements"
          value={totals.activePlacements}
          hint={`${totals.approvedPlacements} approved or upcoming`}
          to="/coordinator/placements" />
        
        <StatCard
          label="Pending applications"
          value={totals.pendingApplications}
          hint="Anywhere in the review pipeline" />
        
        <StatCard
          label="Completed placements"
          value={totals.completedPlacements}
          hint="Evaluated and closed" />
        
        <StatCard
          label="Completion rate"
          value={`${completionRate}%`}
          hint="Of concluded placements" />
        
        <StatCard
          label="Overdue supervision"
          value={totals.overdueSupervision}
          hint="Active placements past 30 days"
          tone={totals.overdueSupervision > 0 ? 'attention' : 'default'} />
        
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Applications over time"
          question="Is application volume rising or falling across cycles?"
          hasData={state.data.applicationsByMonth.length > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.data.applicationsByMonth}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" {...chartAxisProps} />
              <YAxis allowDecimals={false} {...chartAxisProps} />
              <Tooltip {...chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                name="Applications"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3 }} />
              
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Placement status distribution"
          question="Where are placements concentrated right now?"
          hasData={state.data.placementStatus.length > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={state.data.placementStatus.map((d) => ({ ...d, name: label(d.name) }))}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}>
                
                {state.data.placementStatus.map((_, i) =>
                <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                )}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 flex flex-wrap justify-center gap-3">
            {state.data.placementStatus.map((d, i) =>
            <li key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_SERIES[i % CHART_SERIES.length] }}
                aria-hidden />
              
                {label(d.name)} ({d.value})
              </li>
            )}
          </ul>
        </ChartCard>

        <ChartCard
          title="Placements by programme"
          question="Which programmes are being served, and which are under-placed?"
          hasData={state.data.placementsByProgramme.length > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.data.placementsByProgramme} layout="vertical">
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
              <YAxis type="category" dataKey="name" width={150} {...chartAxisProps} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" name="Placements" fill={CHART_COLORS.approved} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Opportunities by industry"
          question="Which sectors are hosting our students?"
          hasData={state.data.opportunitiesByIndustry.length > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.data.opportunitiesByIndustry} layout="vertical">
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
              <YAxis type="category" dataKey="name" width={150} {...chartAxisProps} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" name="Opportunities" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Company participation"
            description="Which partners are actually taking students, not just posting?" />
          
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={state.data.companyParticipation}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" {...chartAxisProps} interval={0} height={50} />
                <YAxis allowDecimals={false} {...chartAxisProps} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="opportunities" name="Opportunities" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="placements" name="Placements" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </>);

}