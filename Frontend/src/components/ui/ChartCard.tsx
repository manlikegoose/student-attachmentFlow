import React from 'react';
import { Card, CardHeader } from './Card';
import { EmptyState } from './States';

/**
 * Charts are only worth their space when the caption states the administrative
 * question they answer, so the question is a required prop.
 */
export function ChartCard({
  title,
  question,
  children,
  hasData = true,
  height = 240,
  action







}: {title: string;question: string;children: React.ReactNode;hasData?: boolean;height?: number;action?: React.ReactNode;}) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} description={question} action={action} />
      <div className="flex-1 p-4">
        {hasData ?
        <div style={{ height }} className="w-full">
            {children}
          </div> :

        <EmptyState
          title="No data yet"
          description="This chart populates once the programme has activity in this area." />

        }
      </div>
    </Card>);

}

/** Shared palette so every chart in the product reads the same way. */
export const CHART_COLORS = {
  primary: '#1e4d8c',
  secondary: '#6394c8',
  approved: '#0f766e',
  pending: '#b45309',
  rejected: '#b91c1c',
  active: '#1d4ed8',
  muted: '#94a3b8'
};

export const CHART_SERIES = [
CHART_COLORS.primary,
CHART_COLORS.approved,
CHART_COLORS.pending,
CHART_COLORS.active,
CHART_COLORS.secondary,
CHART_COLORS.rejected];


export const chartAxisProps = {
  tick: { fill: '#64748b', fontSize: 11 },
  axisLine: { stroke: '#e2e8f0' },
  tickLine: false
} as const;

export const chartTooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    boxShadow: '0 8px 24px -6px rgb(15 41 71 / 0.16)'
  },
  labelStyle: { color: '#0f2947', fontWeight: 600 }
} as const;