import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardPenIcon, MessageSquareIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar, CompanyLogo } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Input, Select, Textarea, Checkbox } from '../../components/ui/Form';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { getPlacement } from '../../services/placementService';
import {
  createSupervisionReport,
  giveProgressFeedback,
  listProgressReports,
  listSupervisionReports } from
'../../services/supervisionService';
import { SUPERVISION_TYPES, label } from '../../types/enums';
import type { SupervisionType } from '../../types/enums';
import { dateRange, formatDate } from '../../utils/format';
import { todayISO } from '../../services/store';
import { useToast } from '../../contexts/ToastContext';

const emptyReport = (placementId: string) => ({
  placementId,
  date: todayISO(),
  type: 'PHYSICAL_VISIT' as SupervisionType,
  studentPresent: true,
  progressSummary: '',
  technicalProgress: '',
  challenges: '',
  strengths: '',
  areasForImprovement: '',
  recommendations: '',
  supervisorComments: ''
});

export function SupervisorPlacementDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [recording, setRecording] = useState(false);
  const [form, setForm] = useState(emptyReport(id));
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const state = useAsync(() => getPlacement(id), [id]);
  const reports = useAsync(() => listSupervisionReports({ placementId: id, pageSize: 20 }), [id]);
  const progress = useAsync(() => listProgressReports({ placementId: id, pageSize: 20 }), [id]);

  const save = useMutation(async (submit: boolean) => {
    const record = await createSupervisionReport(form, submit);
    toast.success(submit ? 'Supervision report submitted' : 'Draft saved');
    setRecording(false);
    setForm(emptyReport(id));
    reports.refetch();
    state.refetch();
    return record;
  });

  const respond = useMutation(async () => {
    await giveProgressFeedback(feedbackFor!, feedback);
    toast.success('Feedback sent to the student');
    setFeedbackFor(null);
    setFeedback('');
    progress.refetch();
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const p = state.data;
  const set = (key: keyof typeof form) => (value: string | boolean) =>
  setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'Placements', to: '/supervisor/placements' },
        { label: p.student.fullName }]
        }
        title={p.student.fullName}
        description={`${p.opportunity.title} · ${p.company.name}`}
        meta={
        <>
            <StatusBadge status={p.status} />
            {p.supervisionOverdue && <Badge tone="rejected">Supervision overdue</Badge>}
          </>
        }
        actions={
        <Button
          icon={<ClipboardPenIcon className="h-4 w-4" />}
          onClick={() => {
            setForm(emptyReport(id));
            setRecording(true);
          }}>
          
            Record supervision
          </Button>
        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Supervision reports"
              description={`${reports.data?.count ?? 0} recorded`} />
            
            {reports.loading && !reports.data ?
            <LoadingState rows={2} /> :
            (reports.data?.results.length ?? 0) === 0 ?
            <EmptyState
              title="No supervision recorded yet"
              description="Record your first visit or check-in for this student." /> :


            <ul className="divide-y divide-slate-100">
                {reports.data!.results.map((r) =>
              <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {label(r.type)} · {formatDate(r.date)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={r.studentPresent ? 'approved' : 'pending'}>
                          {r.studentPresent ? 'Present' : 'Absent'}
                        </Badge>
                        {r.submitted ?
                    <Badge tone="approved">Submitted</Badge> :

                    <Badge tone="muted">Draft</Badge>
                    }
                      </div>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                      {r.progressSummary}
                    </p>
                    {r.recommendations &&
                <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
                        <span className="font-medium">Recommendations:</span> {r.recommendations}
                      </p>
                }
                  </li>
              )}
              </ul>
            }
          </Card>

          <Card>
            <CardHeader
              title="Student progress reports"
              description="Periodic self-reports submitted by the student" />
            
            {(progress.data?.results.length ?? 0) === 0 ?
            <EmptyState title="No progress reports submitted" /> :

            <ul className="divide-y divide-slate-100">
                {progress.data!.results.map((r) =>
              <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-navy-900">
                        {dateRange(r.periodStart, r.periodEnd)}
                      </p>
                      {r.supervisorFeedback ?
                  <Badge tone="approved">Reviewed</Badge> :

                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<MessageSquareIcon className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setFeedback('');
                      setFeedbackFor(r.id);
                    }}>
                    
                          Give feedback
                        </Button>
                  }
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                      {r.activitiesCompleted}
                    </p>
                    {r.supervisorFeedback &&
                <div className="mt-3 rounded-md border border-approved-border bg-approved-bg px-3.5 py-2.5">
                        <p className="text-[12px] leading-relaxed text-approved-fg">
                          {r.supervisorFeedback}
                        </p>
                      </div>
                }
                  </li>
              )}
              </ul>
            }
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Placement" />
            <CardBody>
              <div className="flex items-center gap-3">
                <CompanyLogo logoText={p.company.logoText} size="lg" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy-900">{p.company.name}</p>
                  <p className="truncate text-[12px] text-slate-500">{p.company.location}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Position', value: p.opportunity.title },
                { label: 'Dates', value: dateRange(p.startDate, p.endDate) },
                { label: 'Work mode', value: label(p.opportunity.workMode) },
                {
                  label: 'Workplace supervisor',
                  value: p.workplaceSupervisor ?
                  `${p.workplaceSupervisor.fullName} — ${p.workplaceSupervisor.jobTitle}` :
                  'Not assigned'
                },
                {
                  label: 'Last supervision',
                  value: p.lastSupervisionDate ? formatDate(p.lastSupervisionDate) : 'None'
                }]
                } />
              
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Student" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={p.student.fullName} size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-navy-900">{p.student.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{p.student.studentNumber}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={recording}
        onClose={() => setRecording(false)}
        title="Record supervision"
        description={`${p.student.fullName} · ${p.company.name}`}
        size="lg"
        footer={
        <>
            <Button variant="secondary" loading={save.submitting} onClick={() => save.run(false)}>
              Save draft
            </Button>
            <Button loading={save.submitting} onClick={() => save.run(true)}>
              Submit report
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={save.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of supervision" htmlFor="date" required error={save.fieldErrors.date}>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => set('date')(e.target.value)} />
              
            </Field>
            <Field label="Type" htmlFor="type" required>
              <Select
                id="type"
                value={form.type}
                onChange={(e) => set('type')(e.target.value)}
                options={SUPERVISION_TYPES.map((t) => ({ value: t, label: label(t) }))} />
              
            </Field>
          </div>
          <Checkbox
            id="studentPresent"
            label="The student was present"
            checked={form.studentPresent}
            onChange={(e) => set('studentPresent')(e.target.checked)} />
          
          <Field
            label="Progress summary"
            htmlFor="progressSummary"
            required
            error={save.fieldErrors.progressSummary}
            hint="At least 40 characters when submitting.">
            
            <Textarea
              id="progressSummary"
              value={form.progressSummary}
              onChange={(e) => set('progressSummary')(e.target.value)} />
            
          </Field>
          <Field
            label="Technical progress"
            htmlFor="technicalProgress"
            required
            error={save.fieldErrors.technicalProgress}>
            
            <Textarea
              id="technicalProgress"
              rows={3}
              value={form.technicalProgress}
              onChange={(e) => set('technicalProgress')(e.target.value)} />
            
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Strengths" htmlFor="strengths">
              <Textarea
                id="strengths"
                rows={3}
                value={form.strengths}
                onChange={(e) => set('strengths')(e.target.value)} />
              
            </Field>
            <Field label="Areas for improvement" htmlFor="areasForImprovement">
              <Textarea
                id="areasForImprovement"
                rows={3}
                value={form.areasForImprovement}
                onChange={(e) => set('areasForImprovement')(e.target.value)} />
              
            </Field>
            <Field label="Challenges raised" htmlFor="challenges">
              <Textarea
                id="challenges"
                rows={3}
                value={form.challenges}
                onChange={(e) => set('challenges')(e.target.value)} />
              
            </Field>
            <Field
              label="Recommendations"
              htmlFor="recommendations"
              required
              error={save.fieldErrors.recommendations}>
              
              <Textarea
                id="recommendations"
                rows={3}
                value={form.recommendations}
                onChange={(e) => set('recommendations')(e.target.value)} />
              
            </Field>
          </div>
          <Field label="Additional comments" htmlFor="supervisorComments">
            <Textarea
              id="supervisorComments"
              rows={3}
              value={form.supervisorComments}
              onChange={(e) => set('supervisorComments')(e.target.value)} />
            
          </Field>
        </div>
      </Modal>

      <Modal
        open={feedbackFor !== null}
        onClose={() => setFeedbackFor(null)}
        title="Feedback on progress report"
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setFeedbackFor(null)} disabled={respond.submitting}>
              Cancel
            </Button>
            <Button loading={respond.submitting} onClick={() => respond.run()}>
              Send feedback
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={respond.error} />
          <Field label="Your feedback" htmlFor="feedback" required error={respond.fieldErrors.feedback}>
            <Textarea
              id="feedback"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)} />
            
          </Field>
        </div>
      </Modal>
    </>);

}