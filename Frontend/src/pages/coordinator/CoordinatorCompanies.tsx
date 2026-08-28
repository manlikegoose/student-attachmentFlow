import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2Icon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterBar } from '../../components/ui/FilterBar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { VerificationBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { useAsync } from '../../hooks/useAsync';
import { listCompanies } from '../../services/directoryService';
import { COMPANY_VERIFICATION_STATUSES, label } from '../../types/enums';
import type { CompanyVerificationStatus } from '../../types/enums';
import type { CompanyDirectoryView } from '../../types/views';

const PAGE_SIZE = 10;

export function CoordinatorCompanies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search,
      verificationStatus: (status || undefined) as CompanyVerificationStatus | undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [search, status, page]
  );
  const state = useAsync(() => listCompanies(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="Companies"
        description="Host organisations registered with the attachment programme. Only verified organisations may publish opportunities." />
      

      <Card>
        <div className="space-y-3 border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, industry or town"
            label="Search companies" />
          
          <FilterBar
            onChange={(_, value) => {
              setStatus(value);
              setPage(1);
            }}
            onReset={() => {
              setStatus('');
              setPage(1);
            }}
            filters={[
            {
              key: 'verificationStatus',
              label: 'Verification',
              value: status,
              options: COMPANY_VERIFICATION_STATUSES.map((s) => ({ value: s, label: label(s) }))
            }]
            } />
          
        </div>

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <>
            <DataTable<CompanyDirectoryView>
            caption="Registered companies"
            rows={state.data.results}
            getRowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/coordinator/companies/${r.id}`)}
            columns={[
            {
              key: 'name',
              header: 'Organisation',
              render: (r) =>
              <div className="flex items-center gap-3">
                      <CompanyLogo logoText={r.logoText} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-navy-900">{r.name}</p>
                        <p className="truncate text-[12px] text-slate-500">{r.industry}</p>
                      </div>
                    </div>

            },
            { key: 'town', header: 'Town', render: (r) => r.town, secondary: true },
            {
              key: 'opportunities',
              header: 'Postings',
              render: (r) => `${r.publishedOpportunityCount} / ${r.opportunityCount}`,
              secondary: true
            },
            { key: 'applicants', header: 'Applicants', render: (r) => r.applicantCount },
            { key: 'interns', header: 'Active interns', render: (r) => r.activeInterns, secondary: true },
            {
              key: 'status',
              header: 'Verification',
              align: 'right',
              render: (r) => <VerificationBadge status={r.verificationStatus} />
            }]
            }
            mobileCard={(r) =>
            <div className="flex items-start gap-3">
                  <CompanyLogo logoText={r.logoText} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-navy-900">{r.name}</p>
                    <p className="truncate text-[12px] text-slate-500">
                      {r.industry} · {r.town}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {r.applicantCount} applicants · {r.activeInterns} active interns
                    </p>
                    <div className="mt-2">
                      <VerificationBadge status={r.verificationStatus} />
                    </div>
                  </div>
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="companies" />
          
          </> :

        <EmptyState
          icon={<Building2Icon className="h-5 w-5" />}
          title="No companies match these filters"
          description="Clear the search or verification filter to see the full register." />

        }
      </Card>
    </>);

}