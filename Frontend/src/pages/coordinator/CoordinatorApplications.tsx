import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listApplications } from '../../services/applicationService';
import { formatDate } from '../../utils/format';
import type { ApplicationStatus } from '../../types/enums';

const PAGE_SIZE = 10;

const TABS: {id: string;label: string;status?: ApplicationStatus;}[] = [
{ id: 'UNIVERSITY_REVIEW', label: 'Awaiting university review', status: 'UNIVERSITY_REVIEW' },
{ id: 'UNIVERSITY_APPROVED', label: 'Approved', status: 'UNIVERSITY_APPROVED' },
{ id: 'UNIVERSITY_REJECTED', label: 'Rejected', status: 'UNIVERSITY_REJECTED' },
{ id: 'ALL', label: 'All applications' }];


export function CoordinatorApplications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('UNIVERSITY_REVIEW');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const status = TABS.find((t) => t.id === tab)?.status;
  const query = useMemo(() => ({ status, search, page, pageSize: PAGE_SIZE }), [status, search, page]);
  const state = useAsync(() => listApplications(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="University review"
        description="Applications accepted by a host organisation and awaiting the attachment office decision." />
      

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by student name, registration number or posting"
            label="Search applications" />
          
        </div>
        <Tabs
          items={TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={tab}
          onChange={(id) => {
            setTab(id);
            setPage(1);
          }}
          className="px-4" />
        

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <>
            <DataTable
            caption="Applications"
            rows={state.data.results}
            getRowKey={(a) => a.id}
            onRowClick={(a) => navigate(`/coordinator/applications/${a.id}`)}
            columns={[
            {
              key: 'student',
              header: 'Student',
              render: (a) =>
              <div className="flex items-center gap-3">
                      <Avatar name={a.student.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy-900">{a.student.fullName}</p>
                        <p className="truncate text-[12px] text-slate-500">
                          {a.student.studentNumber}
                        </p>
                      </div>
                    </div>

            },
            {
              key: 'programme',
              header: 'Programme',
              secondary: true,
              render: (a) =>
              <span className="text-[13px] text-slate-600">{a.student.programme}</span>

            },
            {
              key: 'posting',
              header: 'Placement',
              render: (a) =>
              <div className="min-w-0">
                      <p className="truncate text-[13px] text-navy-900">{a.opportunity.title}</p>
                      <p className="truncate text-[12px] text-slate-500">{a.company.name}</p>
                    </div>

            },
            {
              key: 'submitted',
              header: 'Submitted',
              secondary: true,
              render: (a) =>
              <span className="text-[13px] text-slate-600">{formatDate(a.submittedAt)}</span>

            },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
            {
              key: 'action',
              header: '',
              align: 'right',
              render: (a) =>
              <Button
                size="sm"
                variant={a.status === 'UNIVERSITY_REVIEW' ? 'primary' : 'ghost'}
                onClick={() => navigate(`/coordinator/applications/${a.id}`)}>
                
                      {a.status === 'UNIVERSITY_REVIEW' ? 'Review' : 'View'}
                    </Button>

            }]
            }
            mobileCard={(a) =>
            <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-navy-900">
                        {a.student.fullName}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">{a.student.programme}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-2 truncate text-[12px] text-slate-600">
                    {a.opportunity.title} · {a.company.name}
                  </p>
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="applications" />
          
          </> :

        <EmptyState
          title="This queue is clear"
          description="Applications arrive here once a host organisation accepts a student." />

        }
      </Card>
    </>);

}