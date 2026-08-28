import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  Building2Icon,
  ClipboardCheckIcon,
  FileWarningIcon,
  GraduationCapIcon,
  MessagesSquareIcon,
  SearchXIcon,
  UsersIcon } from
'lucide-react';
import { BRAND } from '../../config/brand';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';

const LIFECYCLE = [
'Opportunity',
'Application',
'Company review',
'University review',
'Placement',
'Supervisor assigned',
'Supervision',
'Final evaluation',
'Completion'];


const PROBLEMS = [
{
  icon: SearchXIcon,
  title: 'Students cannot see where they stand',
  body: 'Applications disappear into email and phone calls. Nobody can tell a student what happens next, or what is waiting on them.'
},
{
  icon: FileWarningIcon,
  title: 'Documents are scattered',
  body: 'Insurance cover, introduction letters and CVs live across WhatsApp threads, printouts and personal drives with no review trail.'
},
{
  icon: MessagesSquareIcon,
  title: 'Approvals are unauditable',
  body: 'Who approved a placement, and on what evidence, is reconstructed from memory when it is questioned months later.'
}];


const ROLES = [
{
  icon: GraduationCapIcon,
  title: 'Students',
  body: 'Discover published opportunities, apply with reviewed documents, and follow the placement through to completion on one timeline.'
},
{
  icon: Building2Icon,
  title: 'Companies',
  body: 'Publish attachment slots once verified, review applicants against real profiles and documents, and manage workplace supervisors.'
},
{
  icon: ClipboardCheckIcon,
  title: 'Attachment office',
  body: 'Verify organisations, approve placements against required documents, assign supervisors by workload, and audit every decision.'
},
{
  icon: UsersIcon,
  title: 'Academic supervisors',
  body: 'See assigned students, record supervision visits, review progress reports and submit the final evaluation.'
}];


export function Landing() {
  return (
    <PublicLayout>
      {/* Hero — the single thing this page must land */}
      <section className="border-b border-slate-200 bg-navy-900">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-300">
              {BRAND.institution} · Industrial Attachment Office
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              One record for every attachment, from opportunity to completion.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-200">
              {BRAND.name} replaces the spreadsheets, printed forms and WhatsApp threads that
              currently coordinate industrial attachment. Students, host organisations, the
              attachment office and academic supervisors work from the same record, and every
              approval leaves an audit trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg">Sign in to your portal</Button>
              </Link>
              <Link to="/opportunities">
                <Button
                  size="lg"
                  variant="secondary"
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  className="border-navy-600 bg-transparent text-white hover:bg-navy-800 hover:text-white">
                  
                  Browse open opportunities
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            The attachment lifecycle
          </h2>
          <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
            {LIFECYCLE.map((step, i) =>
            <li key={step} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-navy-900">
                  <span className="text-[11px] tabular-nums text-slate-400">{i + 1}</span>
                  {step}
                </span>
                {i < LIFECYCLE.length - 1 &&
              <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300" aria-hidden />
              }
              </li>
            )}
          </ol>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy-900">
            What coordination looks like today
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Small and medium universities run attachment across disconnected tools. The cost is
            not inconvenience — it is placements that cannot be tracked, supervised or defended.
          </p>
        </div>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) =>
          <div key={p.title}>
              <p.icon className="h-5 w-5 text-navy-600" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-navy-900">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{p.body}</p>
            </div>
          )}
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-navy-900">
            Four roles, one workflow
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ROLES.map((r) =>
            <div key={r.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-50 text-navy-600">
                    <r.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="text-[15px] font-semibold text-navy-900">{r.title}</h3>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">{r.body}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Registering a host organisation?
            </h2>
            <p className="mt-1 text-[13px] text-slate-600">
              Organisations are verified by the attachment office before opportunities can be
              published.
            </p>
          </div>
          <Link to="/register">
            <Button size="lg">Create an account</Button>
          </Link>
        </div>
      </section>
    </PublicLayout>);

}