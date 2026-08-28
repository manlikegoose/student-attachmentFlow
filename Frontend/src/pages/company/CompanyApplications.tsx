import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardListIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listApplications } from '../../services/applicationService';
import { formatDate } from '../../utils/format';
import type { ApplicationView } from '../../types/views';

export function CompanyApplications() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('review');
  const state = useAsync(() => listApplications({ search, pageSize: 100 }), [search]);

  const all = state.data?.results ?? [];
  const groups = useMemo(
    () => ({
      review: all.filter((a) => ['SUBMITTED', 'UNDER_COMPANY_REVIEW'].includes(a.status)),
      accepted: all.filter((a) =>
      ['UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(a.status)
      ),
      declined: all.filter((a) => ['COMPANY_REJECTED', 'UNIVERSITY_REJECTED'].includes(a.status)),
      all
    }),
    [all]
  );
  const rows = groups[tab as keyof typeof groups] ?? all;

  return (
    <>
      <PageHeader
        title="Applicants"
        description="Review student profiles and documents, then accept or decline. Accepted applicants go to the university for approval." />
      

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by student name, number or opportunity" />
        
      </div>

      <Card>
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
          { id: 'review', label: 'Awaiting review', count: groups.review.length },
          { id: 'accepted', label: 'Accepted', count: groups.accepted.length },
          { id: 'declined', label: 'Declined', count: groups.declined.length },
          { id: 'all', label: 'All', count: all.length }]
          } />
        

        {state.loading && !state.data ?
        <LoadingState rows={4} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        rows.length === 0 ?
        <EmptyState
          icon={<ClipboardListIcon className="h-5 w-5" />}
          title="Nothing in this queue"
          description="Applications move through this list as you review them." /> :


        <DataTable<ApplicationView>
          caption="Applicants"
          rows={rows}
          getRowKey={(a) => a.id}
          onRowClick={(a) => navigate(`/company/applications/${a.id}`)}
          columns={[
          {
            key: 'student',
            header: 'Student',
            render: (a) =>
            <div className="flex items-center gap-2.5">
                    <Avatar name={a.student.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{a.student.fullName}</p>
                      <p className="truncate text-[12px] text-slate-500">{a.student.studentNumber}</p>
                    </div>
                  </div>

          },
          {
            key: 'programme',
            header: 'Programme',
            secondary: true,
            render: (a) =>
            <span className="text-[13px] text-slate-600">
                    {a.student.programme} · Year {a.student.yearOfStudy}
                  </span>

          },
          {
            key: 'opportunity',
            header: 'Opportunity',
            render: (a) => <span className="text-[13px]">{a.opportunity.title}</span>
          },
          {
            key: 'submitted',
            header: 'Submitted',
            secondary: true,
            render: (a) =>
            <span className="text-[13px] text-slate-600">{formatDate(a.submittedAt)}</span>

          },
          {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (a) => <StatusBadge status={a.status} />
          }]
          }
          mobileCard={(a) =>
          <div className="flex items-start gap-3">
                <Avatar name={a.student.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-navy-900">
                    {a.student.fullName}
                  </p>
                  <p className="truncate text-[12px] text-slate-500">{a.opportunity.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Submitted {formatDate(a.submittedAt)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
          } />

        }
      </Card>
    </>);

}