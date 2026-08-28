import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon } from
'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { ApplyDialog } from '../../components/domain/ApplyDialog';
import { useAsync } from '../../hooks/useAsync';
import { getOpportunity } from '../../services/opportunityService';
import { listApplications } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import { dateRange, deadlineLabel } from '../../utils/format';
import { label } from '../../types/enums';
import { ACTIVE_APPLICATION_STATUSES } from '../../domain/rules';

export function OpportunityDetail({ embedded = false }: {embedded?: boolean;}) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);

  const state = useAsync(() => getOpportunity(id), [id]);
  const isStudent = session?.role === 'STUDENT';
  const existing = useAsync(
    () => isStudent ? listApplications({ opportunityId: id }) : Promise.resolve(null),
    [id, isStudent]
  );

  const opportunity = state.data;
  const myApplication = existing.data?.results?.[0] ?? null;
  const hasActiveApplication =
  myApplication && ACTIVE_APPLICATION_STATUSES.includes(myApplication.status);

  const content = state.loading && !opportunity ?
  <Card>
      <LoadingState rows={5} />
    </Card> :
  state.error || !opportunity ?
  <ErrorState
    title="Opportunity unavailable"
    message={state.error ?? 'This posting is no longer published.'}
    onRetry={state.refetch} /> :


  <>
      <PageHeader
      breadcrumbs={[
      { label: 'Opportunities', to: embedded ? '/student/opportunities' : '/opportunities' },
      { label: opportunity.title }]
      }
      title={opportunity.title}
      description={`${opportunity.company.name} · ${opportunity.department}`}
      meta={
      <>
            <VerificationBadge status={opportunity.company.verificationStatus} />
            <StatusBadge status={opportunity.status} />
            <Badge tone={opportunity.isOpen ? 'approved' : 'muted'}>
              {deadlineLabel(opportunity.applicationDeadline)}
            </Badge>
          </>
      }
      actions={
      isStudent ?
      hasActiveApplication ?
      <Button
        variant="secondary"
        onClick={() => navigate(`/student/applications/${myApplication!.id}`)}>
        
                View your application
              </Button> :

      <Button
        size="lg"
        disabled={!opportunity.isOpen}
        onClick={() => setApplyOpen(true)}>
        
                {opportunity.isOpen ? 'Apply for this attachment' : 'Applications closed'}
              </Button> :

      !session ?
      <Link to="/login">
              <Button size="lg">Sign in to apply</Button>
            </Link> :
      null
      } />
    

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="About this attachment" />
            <CardBody>
              <Prose text={opportunity.description} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Responsibilities" />
            <CardBody>
              <ul className="space-y-2">
                {opportunity.responsibilities.map((item) =>
              <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-400" aria-hidden />
                    {item}
                  </li>
              )}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Requirements" />
            <CardBody>
              <ul className="space-y-2">
                {opportunity.requirements.map((item) =>
              <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-400" aria-hidden />
                    {item}
                  </li>
              )}
              </ul>
              {opportunity.preferredSkills.length > 0 &&
            <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Preferred skills
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {opportunity.preferredSkills.map((s) =>
                <li key={s}>
                        <Badge>{s}</Badge>
                      </li>
                )}
                  </ul>
                </div>
            }
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Placement details" />
            <CardBody>
              <DescriptionList
              columns={1}
              items={[
              {
                label: 'Dates',
                value:
                <span className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {dateRange(opportunity.startDate, opportunity.endDate)}
                      </span>

              },
              {
                label: 'Duration',
                value:
                <span className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {opportunity.durationWeeks} weeks
                      </span>

              },
              {
                label: 'Location',
                value:
                <span className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {opportunity.location} · {label(opportunity.workMode)}
                      </span>

              },
              {
                label: 'Available slots',
                value:
                <span className="flex items-center gap-1.5">
                        <UsersIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {opportunity.slotsRemaining} of {opportunity.slots} remaining
                      </span>

              },
              {
                label: 'Application deadline',
                value: deadlineLabel(opportunity.applicationDeadline)
              },
              {
                label: 'Department',
                value:
                <span className="flex items-center gap-1.5">
                        <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {opportunity.department}
                      </span>

              }]
              } />
            
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Host organisation" />
            <CardBody>
              <div className="flex items-start gap-3">
                <CompanyLogo logoText={opportunity.company.logoText} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">
                    {opportunity.company.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {opportunity.company.industry}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">{opportunity.company.location}</p>
                  <div className="mt-2">
                    <VerificationBadge status={opportunity.company.verificationStatus} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {isStudent &&
    <ApplyDialog
      opportunity={opportunity}
      open={applyOpen}
      onClose={() => setApplyOpen(false)}
      onApplied={() => {
        state.refetch();
        existing.refetch();
      }} />

    }
    </>;


  if (embedded) return content;

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{content}</div>
    </PublicLayout>);

}