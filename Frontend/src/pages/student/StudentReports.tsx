import React, { useState } from 'react';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Input, Textarea } from '../../components/ui/Form';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { createProgressReport, listProgressReports } from '../../services/supervisionService';
import { dateRange, formatDate } from '../../utils/format';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = {
  periodStart: '',
  periodEnd: '',
  activitiesCompleted: '',
  skillsLearned: '',
  challenges: '',
  achievements: '',
  nextGoals: ''
};

export function StudentReports() {
  const toast = useToast();
  const state = useAsync(() => listProgressReports({ pageSize: 30 }), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const create = useMutation(async () => {
    const record = await createProgressReport(form);
    toast.success('Progress report submitted', 'Your academic supervisor has been notified.');
    setForm(EMPTY);
    setOpen(false);
    state.refetch();
    return record;
  });

  const reports = state.data?.results ?? [];

  return (
    <>
      <PageHeader
        title="Progress reports"
        description="Periodic check-ins on your attachment. Your academic supervisor reviews these and the attachment office monitors them."
        actions={
        <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>
            New report
          </Button>
        } />
      

      {state.loading && !state.data ?
      <LoadingState rows={3} /> :
      state.error ?
      <ErrorState message={state.error} onRetry={state.refetch} /> :
      reports.length === 0 ?
      <Card>
          <EmptyState
          icon={<FileTextIcon className="h-5 w-5" />}
          title="No progress reports yet"
          description="Submit a report at the end of each reporting period to record what you have done and learned."
          action={<Button size="sm" onClick={() => setOpen(true)}>Write your first report</Button>} />
        
        </Card> :

      <div className="space-y-4">
          {reports.map((r) =>
        <Card key={r.id}>
              <CardHeader
            title={dateRange(r.periodStart, r.periodEnd)}
            description={`Submitted ${formatDate(r.submittedAt)}`}
            action={
            r.supervisorFeedback ?
            <Badge tone="approved">Reviewed</Badge> :

            <Badge tone="pending">Awaiting review</Badge>

            } />
          
              <CardBody>
                <DescriptionList
              columns={1}
              items={[
              { label: 'Activities completed', value: r.activitiesCompleted },
              { label: 'Skills learned', value: r.skillsLearned },
              { label: 'Challenges', value: r.challenges },
              { label: 'Achievements', value: r.achievements },
              { label: 'Next goals', value: r.nextGoals }]
              } />
            
                {r.supervisorFeedback &&
            <div className="mt-5 rounded-md border border-approved-border bg-approved-bg px-3.5 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-approved-fg">
                      Supervisor feedback · {formatDate(r.reviewedAt)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-approved-fg">
                      {r.supervisorFeedback}
                    </p>
                  </div>
            }
              </CardBody>
            </Card>
        )}
        </div>
      }

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New progress report"
        description="Report on the period since your last check-in."
        footer={
        <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={create.submitting}>
              Cancel
            </Button>
            <Button onClick={() => create.run()} loading={create.submitting}>
              Submit report
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={create.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Period start"
              htmlFor="periodStart"
              required
              error={create.fieldErrors.periodStart}>
              
              <Input
                id="periodStart"
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
              
            </Field>
            <Field label="Period end" htmlFor="periodEnd" required error={create.fieldErrors.periodEnd}>
              <Input
                id="periodEnd"
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
              
            </Field>
          </div>
          <Field
            label="Activities completed"
            htmlFor="activitiesCompleted"
            required
            error={create.fieldErrors.activitiesCompleted}>
            
            <Textarea
              id="activitiesCompleted"
              value={form.activitiesCompleted}
              onChange={(e) => setForm({ ...form, activitiesCompleted: e.target.value })} />
            
          </Field>
          <Field
            label="Skills learned"
            htmlFor="skillsLearned"
            required
            error={create.fieldErrors.skillsLearned}>
            
            <Textarea
              id="skillsLearned"
              rows={3}
              value={form.skillsLearned}
              onChange={(e) => setForm({ ...form, skillsLearned: e.target.value })} />
            
          </Field>
          <Field label="Challenges" htmlFor="challenges">
            <Textarea
              id="challenges"
              rows={3}
              value={form.challenges}
              onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            
          </Field>
          <Field label="Achievements" htmlFor="achievements">
            <Textarea
              id="achievements"
              rows={3}
              value={form.achievements}
              onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
            
          </Field>
          <Field label="Next goals" htmlFor="nextGoals" required error={create.fieldErrors.nextGoals}>
            <Textarea
              id="nextGoals"
              rows={3}
              value={form.nextGoals}
              onChange={(e) => setForm({ ...form, nextGoals: e.target.value })} />
            
          </Field>
        </div>
      </Modal>
    </>);

}