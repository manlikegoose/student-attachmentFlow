import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { filterOptions, listStudents } from '../../services/directoryService';
import { PLACEMENT_STATUSES, label } from '../../types/enums';
import type { StudentDirectoryView } from '../../types/views';

const PAGE_SIZE = 10;

export function CoordinatorStudents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [placementStatus, setPlacementStatus] = useState('');
  const [page, setPage] = useState(1);

  const options = useAsync(() => filterOptions(), []);
  const state = useAsync(
    () =>
    listStudents({
      search,
      department: department || undefined,
      placementStatus: placementStatus || undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [search, department, placementStatus, page]
  );

  return (
    <>
      <PageHeader
        title="Students"
        description="Every student on the attachment programme, with their placement and document status." />
      

      <div className="mb-4 space-y-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, student number or programme" />
        
        <FilterBar
          onChange={(key, value) => {
            setPage(1);
            if (key === 'department') setDepartment(value);
            if (key === 'placementStatus') setPlacementStatus(value);
          }}
          onReset={() => {
            setDepartment('');
            setPlacementStatus('');
            setPage(1);
          }}
          filters={[
          {
            key: 'department',
            label: 'Department',
            value: department,
            options: (options.data?.departments ?? []).map((d) => ({ value: d, label: d }))
          },
          {
            key: 'placementStatus',
            label: 'Placement',
            value: placementStatus,
            options: PLACEMENT_STATUSES.map((s) => ({ value: s, label: label(s) }))
          }]
          } />
        
      </div>

      <Card>
        {state.loading && !state.data ?
        <LoadingState rows={5} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        (state.data?.results.length ?? 0) === 0 ?
        <EmptyState title="No students match these filters" /> :

        <>
            <DataTable<StudentDirectoryView>
            caption="Students"
            rows={state.data!.results}
            getRowKey={(s) => s.id}
            onRowClick={(s) => navigate(`/coordinator/students/${s.id}`)}
            columns={[
            {
              key: 'student',
              header: 'Student',
              render: (s) =>
              <div className="flex items-center gap-2.5">
                      <Avatar name={s.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{s.fullName}</p>
                        <p className="truncate text-[12px] text-slate-500">{s.studentNumber}</p>
                      </div>
                    </div>

            },
            {
              key: 'programme',
              header: 'Programme',
              secondary: true,
              render: (s) =>
              <span className="text-[13px] text-slate-600">
                      {s.programme} · Year {s.yearOfStudy}
                    </span>

            },
            {
              key: 'applications',
              header: 'Applications',
              render: (s) => <span className="text-[13px] tabular-nums">{s.applicationCount}</span>
            },
            {
              key: 'documents',
              header: 'Documents',
              secondary: true,
              render: (s) =>
              <span className="text-[13px] tabular-nums text-slate-600">
                      {s.documentsApproved}/{s.documentsTotal} approved
                    </span>

            },
            {
              key: 'placement',
              header: 'Placement',
              align: 'right',
              render: (s) =>
              s.placementStatus ?
              <StatusBadge status={s.placementStatus} /> :

              <Badge tone="muted">None</Badge>

            }]
            }
            mobileCard={(s) =>
            <div className="flex items-start gap-3">
                  <Avatar name={s.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-navy-900">{s.fullName}</p>
                    <p className="truncate text-[12px] text-slate-500">{s.programme}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {s.applicationCount} applications · {s.documentsApproved}/{s.documentsTotal}{' '}
                      documents approved
                    </p>
                  </div>
                  {s.placementStatus ?
              <StatusBadge status={s.placementStatus} /> :

              <Badge tone="muted">None</Badge>
              }
                </div>
            } />
          
            <Pagination
            page={page}
            count={state.data!.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="students" />
          
          </>
        }
      </Card>
    </>);

}