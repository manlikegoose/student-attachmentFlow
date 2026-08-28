import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTextIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SearchInput } from '../../components/ui/SearchInput';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listSupervisionReports } from '../../services/supervisionService';
import { formatDate } from '../../utils/format';
import { label } from '../../types/enums';

const TABS = [
{ id: 'ALL', label: 'All reports' },
{ id: 'SUBMITTED', label: 'Submitted' },
{ id: 'DRAFT', label: 'Drafts' }];


export function SupervisorReports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const query = useMemo(
    () => ({
      submitted: tab === 'ALL' ? undefined : tab === 'SUBMITTED',
      pageSize: 50
    }),
    [tab]
  );
  const state = useAsync(() => listSupervisionReports(query), [JSON.stringify(query)]);

  const rows = (state.data?.results ?? []).filter((r) =>
  search.trim() ? r.student.fullName.toLowerCase().includes(search.trim().toLowerCase()) : true
  );

  return (
    <>
      <PageHeader
        title="Supervision reports"
        description="Every report you have recorded. Submitted reports are locked and visible to the student and the attachment office." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by student name"
            label="Search reports" />
          
        </div>
        <Tabs items={TABS} active={tab} onChange={setTab} className="px-4" />

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        rows.length > 0 ?
        <ul className="divide-y divide-slate-100">
            {rows.map((r) =>
          <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={r.student.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {r.student.fullName}
                      </p>
                      <span className="text-[12px] text-slate-500">
                        {label(r.type)} · {formatDate(r.date)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
                      {r.progressSummary || 'No summary recorded yet.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.submitted ?
                <Badge tone="approved">Submitted</Badge> :

                <Badge tone="muted">Draft</Badge>
                }
                    <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/supervisor/placements/${r.placementId}`)}>
                  
                      Open placement
                    </Button>
                  </div>
                </div>
              </li>
          )}
          </ul> :

        <EmptyState
          icon={<FileTextIcon className="h-5 w-5" />}
          title="No reports in this list"
          description="Record supervision from a placement page." />

        }
      </Card>
    </>);

}