import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar, CompanyLogo } from '../../components/ui/Avatar';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Field, FormError, Select } from '../../components/ui/Form';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { RatingDisplay } from '../../components/ui/RatingInput';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  assignAcademicSupervisor,
  completePlacement,
  getPlacement } from
'../../services/placementService';
import { listSupervisors } from '../../services/directoryService';
import { listSupervisionReports } from '../../services/supervisionService';
import { dateRange, formatDate } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

export function CoordinatorPlacementDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [assigning, setAssigning] = useState(false);
  const [choice, setChoice] = useState('');
  const [confirmOverCapacity, setConfirmOverCapacity] = useState(false);
  const [completing, setCompleting] = useState(false);

  const state = useAsync(() => getPlacement(id), [id]);
  const supervisors = useAsync(() => listSupervisors(), []);
  const reports = useAsync(() => listSupervisionReports({ placementId: id, pageSize: 20 }), [id]);

  const assign = useMutation(async (acknowledge: boolean) => {
    const updated = await assignAcademicSupervisor(id, choice, acknowledge);
    toast.success('Academic supervisor assigned', 'The supervisor and student have been notified.');
    setAssigning(false);
    setConfirmOverCapacity(false);
    setChoice('');
    state.setData(updated);
    supervisors.refetch();
    return updated;
  });

  const complete = useMutation(async () => {
    const updated = await completePlacement(id);
    toast.success('Placement marked complete');
    setCompleting(false);
    state.setData(updated);
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const p = state.data;
  const evaluation = p.evaluation;

  const handleAssign = async () => {
    const result = await assign.run(false);
    if (!result && assign.error && assign.errorCode === 'capacity_warning') {
      setConfirmOverCapacity(true);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'Placements', to: '/coordinator/placements' },
        { label: p.student.fullName }]
        }
        title={p.student.fullName}
        description={`${p.opportunity.title} · ${p.company.name}`}
        meta={
        <>
            <StatusBadge status={p.status} />
            {p.supervisionOverdue && <Badge tone="rejected">Supervision overdue</Badge>}
            {!p.academicSupervisor && <Badge tone="pending">No academic supervisor</Badge>}
          </>
        }
        actions={
        <>
            <Button
            variant={p.academicSupervisor ? 'secondary' : 'primary'}
            icon={<UserPlusIcon className="h-4 w-4" />}
            onClick={() => {
              setChoice(p.academicSupervisorId ?? '');
              setAssigning(true);
            }}>
            
              {p.academicSupervisor ? 'Reassign supervisor' : 'Assign supervisor'}
            </Button>
            {p.status === 'ACTIVE' &&
          <Button variant="secondary" onClick={() => setCompleting(true)}>
                Mark complete
              </Button>
          }
          </>
        } />
      

      {complete.error &&
      <div className="mb-5 rounded-md border border-rejected-border bg-rejected-bg px-4 py-3 text-[13px] text-rejected-fg">
          {complete.error}
        </div>
      }

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Supervision history"
              description={`${p.supervisionCount} submitted report${p.supervisionCount === 1 ? '' : 's'}`} />
            
            {reports.loading && !reports.data ?
            <LoadingState rows={2} /> :
            (reports.data?.results.length ?? 0) === 0 ?
            <EmptyState
              title="No supervision recorded"
              description="Reports appear here once the assigned academic supervisor submits them." /> :


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
                        {!r.submitted && <Badge tone="muted">Draft</Badge>}
                      </div>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {p.academicSupervisor?.fullName ?? 'Academic supervisor'}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                      {r.progressSummary}
                    </p>
                  </li>
              )}
              </ul>
            }
          </Card>

          {evaluation &&
          <Card>
              <CardHeader
              title="Final evaluation"
              description={`Submitted ${formatDate(evaluation.submittedAt)}`}
              action={
              <Badge tone="approved">
                    {evaluation.finalScore.toFixed(1)} / 5 · {label(evaluation.recommendation)}
                  </Badge>
              } />
            
              <CardBody>
                <RatingDisplay label="Technical skills" value={evaluation.scores.technicalSkills} />
                <RatingDisplay label="Communication" value={evaluation.scores.communication} />
                <RatingDisplay label="Teamwork" value={evaluation.scores.teamwork} />
                <RatingDisplay label="Professionalism" value={evaluation.scores.professionalism} />
                <RatingDisplay label="Punctuality" value={evaluation.scores.punctuality} />
                <RatingDisplay label="Problem solving" value={evaluation.scores.problemSolving} />
                <RatingDisplay label="Adaptability" value={evaluation.scores.adaptability} />
                <RatingDisplay
                label="Overall performance"
                value={evaluation.scores.overallPerformance} />
              
                <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Strengths', value: evaluation.strengths },
                { label: 'Areas to develop', value: evaluation.weaknesses },
                { label: 'Overall comments', value: evaluation.overallComments }]
                } />
              
              </CardBody>
            </Card>
          }
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Placement record" />
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
                { label: 'Approved', value: formatDate(p.approvedAt) },
                { label: 'Completed', value: p.completedAt ? formatDate(p.completedAt) : '—' },
                { label: 'Progress reports', value: String(p.progressReportCount) }]
                } />
              
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="People" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={p.student.fullName} size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-navy-900">{p.student.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{p.student.programme}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                {
                  label: 'Academic supervisor',
                  value: p.academicSupervisor ?
                  `${p.academicSupervisor.fullName} — ${p.academicSupervisor.department}` :
                  'Not assigned'
                },
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
        </div>
      </div>

      <Modal
        open={assigning}
        onClose={() => setAssigning(false)}
        title="Assign academic supervisor"
        description="Supervisors at or over their recommended capacity are flagged."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setAssigning(false)} disabled={assign.submitting}>
              Cancel
            </Button>
            <Button loading={assign.submitting} disabled={!choice} onClick={handleAssign}>
              Assign
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={assign.error} />
          <Field label="Academic supervisor" htmlFor="supervisor" required>
            <Select
              id="supervisor"
              value={choice}
              placeholder="Select a supervisor"
              onChange={(e) => setChoice(e.target.value)}
              options={(supervisors.data ?? []).map((s) => ({
                value: s.id,
                label: `${s.fullName} — ${s.assigned}/${s.capacity} students${
                s.atCapacity ? ' (at capacity)' : ''}`

              }))} />
            
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOverCapacity}
        title="Assign over capacity?"
        message={assign.error ?? 'This supervisor is already at their recommended capacity.'}
        confirmLabel="Assign anyway"
        loading={assign.submitting}
        onCancel={() => setConfirmOverCapacity(false)}
        onConfirm={() => assign.run(true)} />
      

      <ConfirmDialog
        open={completing}
        title="Mark this placement complete?"
        message="A final evaluation must already be locked. The student will be notified."
        confirmLabel="Mark complete"
        loading={complete.submitting}
        onCancel={() => setCompleting(false)}
        onConfirm={() => complete.run()} />
      
    </>);

}