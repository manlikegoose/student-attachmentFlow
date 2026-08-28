import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { dateRange, deadlineLabel, daysUntil } from '../../utils/format';
import { label } from '../../types/enums';
import type { OpportunityView } from '../../types/views';
import { Badge, StatusBadge, VerificationBadge } from '../ui/Badge';
import { CompanyLogo } from '../ui/Avatar';

export function OpportunityCard({
  opportunity,
  to,
  showStatus = false




}: {opportunity: OpportunityView;to: string;showStatus?: boolean;}) {
  const days = daysUntil(opportunity.applicationDeadline);
  const closingSoon = days !== null && days >= 0 && days <= 7;

  return (
    <Link
      to={to}
      className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-card transition-colors duration-150 ease-smooth hover:border-navy-300">
      
      <div className="flex items-start gap-3">
        <CompanyLogo logoText={opportunity.company.logoText} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-navy-900">
            {opportunity.title}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-slate-600">{opportunity.company.name}</p>
        </div>
        {showStatus && <StatusBadge status={opportunity.status} />}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">
            {opportunity.town} · {label(opportunity.workMode)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <dt className="sr-only">Duration</dt>
          <dd>{opportunity.durationWeeks} weeks</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <dt className="sr-only">Dates</dt>
          <dd className="truncate">{dateRange(opportunity.startDate, opportunity.endDate)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <dt className="sr-only">Slots</dt>
          <dd>
            {opportunity.slotsRemaining} of {opportunity.slots} slots
          </dd>
        </div>
      </dl>

      {opportunity.preferredSkills.length > 0 &&
      <ul className="mt-4 flex flex-wrap gap-1.5">
          {opportunity.preferredSkills.slice(0, 4).map((skill) =>
        <li key={skill}>
              <Badge tone="neutral">{skill}</Badge>
            </li>
        )}
          {opportunity.preferredSkills.length > 4 &&
        <li>
              <Badge tone="muted">+{opportunity.preferredSkills.length - 4}</Badge>
            </li>
        }
        </ul>
      }

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <VerificationBadge status={opportunity.company.verificationStatus} />
        <span
          className={cn(
            'text-[12px] font-medium',
            closingSoon ? 'text-pending-fg' : 'text-slate-500'
          )}>
          
          {deadlineLabel(opportunity.applicationDeadline)}
        </span>
      </div>
    </Link>);

}