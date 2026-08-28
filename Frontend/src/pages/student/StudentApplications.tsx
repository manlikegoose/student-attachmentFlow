import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardListIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Tabs } from '../../components/ui/Tabs';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listApplications } from '../../services/applicationService';
import { ACTIVE_APPLICATION_STATUSES, TERMINAL_APPLICATION_STATUSES } from '../../domain/rules';
import { formatDate } from '../../utils/format';
import type { ApplicationView } from '../../types/views';

const PAGE_SIZE = 10;

export function StudentApplications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('live');
  const [page, setPage] = useState(1);

  const state = useAsync(() => listApplications({ pageSize: 50 }), []);
  const all = state.data?.results ?? [];

  const filtered = useMemo(() => {
    if (tab === 'live') return all.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status));
    if (tab === 'closed') return all.filter((a) => TERMINAL_APPLICATION_STATUSES.includes(a.status));
    return all;
  }, [all, tab]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="My applications"
        description="Every application you have submitted, with the stage it has reached."
        actions={
        <Link to="/student/opportunities">
            <Button variant="secondary">Find opportunities</Button>
          </Link>
        } />
      

      <Card>
        <Tabs
          active={tab}
          onChange={(id) => {
            setTab(id);
            setPage(1);
          }}
          items={[
          {
            id: 'live',
            label: 'In progress',
            count: all.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status)).length
          },
          {
            id: 'closed',
            label: 'Concluded',
            count: all.filter((a) => TERMINAL_APPLICATION_STATUSES.includes(a.status)).length
          },
          { id: 'all', label: 'All', count: all.length }]
          } />
        

        {state.loading && !state.data ?
        <LoadingState rows={4} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        paged.length === 0 ?
        <EmptyState
          icon={<ClipboardListIcon className="h-5 w-5" />}
          title="Nothing here yet"
          description={
          tab === 'live' ?
          'You have no applications awaiting a decision.' :
          'No concluded applications.'
          }
          action={
          <Link to="/student/opportunities">
                <Button size="sm">Browse opportunities</Button>
              </Link>
          } /> :


        <>
            <DataTable<ApplicationView>
            caption="My applications"
            rows={paged}
            getRowKey={(a) => a.id}
            onRowClick={(a) => navigate(`/student/applications/${a.id}`)}
            columns={[
            {
              key: 'opportunity',
              header: 'Opportunity',
              render: (a) =>
              <div className="flex items-center gap-2.5">
                      <CompanyLogo logoText={a.company.logoText} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{a.opportunity.title}</p>
                        <p className="truncate text-[12px] text-slate-500">{a.company.name}</p>
                      </div>
                    </div>

            },
            {
              key: 'location',
              header: 'Location',
              secondary: true,
              render: (a) => <span className="text-[13px]">{a.opportunity.town}</span>
            },
            {
              key: 'submitted',
              header: 'Submitted',
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
                  <CompanyLogo logoText={a.company.logoText} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-navy-900">
                      {a.opportunity.title}
                    </p>
                    <p className="truncate text-[12px] text-slate-500">{a.company.name}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Submitted {formatDate(a.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
            } />
          
            <Pagination
            page={page}
            count={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="applications" />
          
          </>
        }
      </Card>
    </>);

}