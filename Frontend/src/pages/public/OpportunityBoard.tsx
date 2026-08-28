import React, { useCallback, useMemo, useState } from 'react';
import { SearchXIcon } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States';
import { OpportunityCard } from '../../components/domain/OpportunityCard';
import { useAsync } from '../../hooks/useAsync';
import { listOpportunities, skillOptions } from '../../services/opportunityService';
import { filterOptions } from '../../services/directoryService';
import { WORK_MODES, label } from '../../types/enums';
import type { WorkMode } from '../../types/enums';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 9;

export function OpportunityBoard({ embedded = false }: {embedded?: boolean;}) {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [town, setTown] = useState('');
  const [industry, setIndustry] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [skill, setSkill] = useState('');
  const [duration, setDuration] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search,
      town: town || undefined,
      industry: industry || undefined,
      workMode: (workMode || undefined) as WorkMode | undefined,
      skill: skill || undefined,
      maxDurationWeeks: duration ? Number(duration) : undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [search, town, industry, workMode, skill, duration, page]
  );

  const state = useAsync(() => listOpportunities(query), [JSON.stringify(query)]);
  const options = useAsync(() => filterOptions(), []);
  const skills = useAsync(() => skillOptions(), []);

  const onFilter = useCallback((key: string, value: string) => {
    setPage(1);
    if (key === 'town') setTown(value);
    if (key === 'industry') setIndustry(value);
    if (key === 'workMode') setWorkMode(value);
    if (key === 'skill') setSkill(value);
    if (key === 'duration') setDuration(value);
  }, []);

  const reset = () => {
    setTown('');
    setIndustry('');
    setWorkMode('');
    setSkill('');
    setDuration('');
    setPage(1);
  };

  const basePath = embedded && session?.role === 'STUDENT' ? '/student/opportunities' : '/opportunities';

  const body =
  <>
      <PageHeader
      title="Attachment opportunities"
      description={
      embedded ?
      'Published postings from verified host organisations. Applications close on the stated deadline.' :
      'Opportunities published by organisations verified by the university attachment office.'
      } />
    

      <div className="mb-5 space-y-3">
        <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by title, organisation or department"
        label="Search opportunities" />
      
        <FilterBar
        onChange={onFilter}
        onReset={reset}
        filters={[
        {
          key: 'town',
          label: 'Location',
          value: town,
          options: (options.data?.towns ?? []).map((t) => ({ value: t, label: t }))
        },
        {
          key: 'industry',
          label: 'Industry',
          value: industry,
          options: (options.data?.industries ?? []).map((i) => ({ value: i, label: i }))
        },
        {
          key: 'workMode',
          label: 'Work mode',
          value: workMode,
          options: WORK_MODES.map((m) => ({ value: m, label: label(m) }))
        },
        {
          key: 'skill',
          label: 'Skill',
          value: skill,
          options: (skills.data ?? []).map((s) => ({ value: s, label: s }))
        },
        {
          key: 'duration',
          label: 'Duration',
          value: duration,
          options: [
          { value: '8', label: 'Up to 8 weeks' },
          { value: '12', label: 'Up to 12 weeks' },
          { value: '16', label: 'Up to 16 weeks' }]

        }]
        } />
      
      </div>

      {state.loading && state.data === null ?
    <CardSkeleton count={6} /> :
    state.error ?
    <ErrorState message={state.error} onRetry={state.refetch} /> :
    state.data && state.data.results.length > 0 ?
    <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {state.data.results.map((o) =>
        <li key={o.id}>
                <OpportunityCard opportunity={o} to={`${basePath}/${o.id}`} />
              </li>
        )}
          </ul>
          <div className="mt-2 rounded-lg border border-slate-200 bg-white">
            <Pagination
          page={page}
          count={state.data.count}
          pageSize={PAGE_SIZE}
          onChange={setPage}
          itemLabel="opportunities" />
        
          </div>
        </> :

    <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
        icon={<SearchXIcon className="h-5 w-5" />}
        title="No opportunities match these filters"
        description="Try widening the location, industry or duration filters, or clear the search." />
      
        </div>
    }
    </>;


  if (embedded) return body;

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{body}</div>
    </PublicLayout>);

}