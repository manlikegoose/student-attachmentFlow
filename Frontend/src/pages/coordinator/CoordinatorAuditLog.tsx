import React, { useMemo, useState } from 'react';
import { ScrollTextIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { listAuditLog } from '../../services/auditService';
import { AUDIT_ACTIONS, USER_ROLES, label } from '../../types/enums';
import type { AuditAction, UserRole } from '../../types/enums';
import { formatDateTime } from '../../utils/format';

const PAGE_SIZE = 20;

const TONE: Record<string, 'approved' | 'rejected' | 'pending' | 'neutral'> = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUBMITTED: 'pending'
};

function toneFor(action: AuditAction) {
  const suffix = action.split('_').slice(-1)[0];
  return TONE[suffix] ?? 'neutral';
}

export function CoordinatorAuditLog() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search,
      action: (action || undefined) as AuditAction | undefined,
      actorRole: (role || undefined) as UserRole | undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [search, action, role, page]
  );
  const state = useAsync(() => listAuditLog(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="An append-only record of every consequential decision: verifications, approvals, assignments and evaluations." />
      

      <Card>
        <div className="space-y-3 border-b border-slate-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by actor or record"
            label="Search audit log" />
          
          <FilterBar
            onChange={(key, value) => {
              setPage(1);
              if (key === 'action') setAction(value);
              if (key === 'role') setRole(value);
            }}
            onReset={() => {
              setAction('');
              setRole('');
              setPage(1);
            }}
            filters={[
            {
              key: 'action',
              label: 'Action',
              value: action,
              options: AUDIT_ACTIONS.map((a) => ({ value: a, label: label(a) }))
            },
            {
              key: 'role',
              label: 'Actor role',
              value: role,
              options: USER_ROLES.map((r) => ({ value: r, label: label(r) }))
            }]
            } />
          
        </div>

        {state.loading && !state.data ?
        <LoadingState /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        state.data && state.data.results.length > 0 ?
        <>
            <ol className="divide-y divide-slate-100">
              {state.data.results.map((entry) =>
            <li key={entry.id} className="flex gap-4 px-5 py-4">
                  <div className="w-40 shrink-0">
                    <p className="text-[12px] tabular-nums text-slate-500">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={toneFor(entry.action)}>{label(entry.action)}</Badge>
                      <span className="text-[13px] font-medium text-navy-900">
                        {entry.objectLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {entry.actorName} · {label(entry.actorRole)} · {entry.objectType}
                    </p>
                    {entry.metadata?.note &&
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                        {String(entry.metadata.note)}
                      </p>
                }
                    {entry.metadata?.reason &&
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                        {String(entry.metadata.reason)}
                      </p>
                }
                  </div>
                </li>
            )}
            </ol>
            <Pagination
            page={page}
            count={state.data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            itemLabel="entries" />
          
          </> :

        <EmptyState
          icon={<ScrollTextIcon className="h-5 w-5" />}
          title="No audit entries match these filters" />

        }
      </Card>
    </>);

}