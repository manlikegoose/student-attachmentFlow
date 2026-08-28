import React from 'react';
import { DownloadIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import {
  ChartCard,
  CHART_COLORS,
  CHART_SERIES,
  chartAxisProps,
  chartTooltipStyle } from
'../../components/ui/ChartCard';
import { DataTable } from '../../components/ui/DataTable';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { coordinatorAnalytics } from '../../services/analyticsService';
import { useToast } from '../../contexts/ToastContext';
import { label } from '../../types/enums';

export function CoordinatorReports() {
  const toast = useToast();
  const state = useAsync(() => coordinatorAnalytics(), []);

  if (state.loading && !state.data) return <LoadingState rows={6} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const { totals, completionRate, companyParticipation, placementsByProgramme } = state.data;

  return (
    <>
      <PageHeader
        title="Programme reports"
        description="Placement outcomes across the current cycle, for faculty and senate reporting."
        actions={
        <Button
          variant="secondary"
          icon={<DownloadIcon className="h-4 w-4" />}
          onClick={() =>
          toast.info(
            'Export queued',
            'In production this generates a PDF from the same report data.'
          )
          }>
          
            Export report
          </Button>
        } />
      

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students on programme" value={totals.students} />
        <StatCard
          label="Placement rate"
          value={`${totals.students > 0 ? Math.round((totals.activePlacements + totals.completedPlacements) / totals.students * 100) : 0}%`}
          hint="Students with an active or completed placement" />
        
        <StatCard label="Completion rate" value={`${completionRate}%`} hint="Of concluded placements" />
        <StatCard
          label="Partner organisations"
          value={totals.verifiedCompanies}
          hint={`${totals.companies} registered in total`} />
        
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Placements by programme"
          question="Which programmes are well served, and which need more partners?"
          hasData={placementsByProgramme.length > 0}>
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={placementsByProgramme} layout="vertical">
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
              <YAxis type="category" dataKey="name" width={160} {...chartAxisProps} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" name="Placements" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Placement outcomes"
          question="How do placements conclude across the cycle?"
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
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Partner participation"
          description="Postings created versus students actually hosted" />
        
        <DataTable
          caption="Partner participation"
          rows={companyParticipation}
          getRowKey={(r) => r.name}
          columns={[
          { key: 'name', header: 'Organisation', render: (r) => r.name },
          { key: 'opportunities', header: 'Postings', render: (r) => r.opportunities },
          { key: 'placements', header: 'Students hosted', render: (r) => r.placements },
          {
            key: 'ratio',
            header: 'Conversion',
            align: 'right',
            render: (r) =>
            r.opportunities > 0 ?
            `${Math.round(r.placements / r.opportunities * 100)}%` :
            '—'
          }]
          }
          mobileCard={(r) =>
          <div>
              <p className="text-[13px] font-medium text-navy-900">{r.name}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {r.opportunities} postings · {r.placements} students hosted
              </p>
            </div>
          } />
        
        <CardBody className="border-t border-slate-100">
          <p className="text-[12px] leading-relaxed text-slate-500">
            Conversion compares approved placements against postings created. A low ratio usually
            means postings are going unfilled rather than partners declining students.
          </p>
        </CardBody>
      </Card>
    </>);

}