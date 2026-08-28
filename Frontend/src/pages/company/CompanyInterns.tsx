import React, { useState } from 'react';
import { GraduationCapIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Select } from '../../components/ui/Form';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { assignWorkplaceSupervisor, listPlacements } from '../../services/placementService';
import { listWorkplaceSupervisors } from '../../services/directoryService';
import { dateRange } from '../../utils/format';
import { useToast } from '../../contexts/ToastContext';
import type { PlacementView } from '../../types/views';

export function CompanyInterns() {
  const toast = useToast();
  const state = useAsync(() => listPlacements({ pageSize: 50 }), []);
  const supervisors = useAsync(() => listWorkplaceSupervisors(), []);
  const [target, setTarget] = useState<PlacementView | null>(null);
  const [choice, setChoice] = useState('');

  const assign = useMutation(async () => {
    await assignWorkplaceSupervisor(target!.id, choice);
    toast.success('Workplace supervisor assigned');
    setTarget(null);
    setChoice('');
    state.refetch();
  });

  const rows = state.data?.results ?? [];

  return (
    <>
      <PageHeader
        title="Interns"
        description="Students placed with your organisation, across every cycle." />
      

      <Card>
        {state.loading && !state.data ?
        <LoadingState rows={4} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        rows.length === 0 ?
        <EmptyState
          icon={<GraduationCapIcon className="h-5 w-5" />}
          title="No interns yet"
          description="Once the university approves an applicant you accepted, their placement appears here." /> :


        <DataTable<PlacementView>
          caption="Interns"
          rows={rows}
          getRowKey={(p) => p.id}
          columns={[
          {
            key: 'student',
            header: 'Student',
            render: (p) =>
            <div className="flex items-center gap-2.5">
                    <Avatar name={p.student.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{p.student.fullName}</p>
                      <p className="truncate text-[12px] text-slate-500">{p.student.programme}</p>
                    </div>
                  </div>

          },
          {
            key: 'position',
            header: 'Position',
            secondary: true,
            render: (p) => <span className="text-[13px]">{p.opportunity.title}</span>
          },
          {
            key: 'dates',
            header: 'Dates',
            render: (p) =>
            <span className="text-[13px] text-slate-600">
                    {dateRange(p.startDate, p.endDate)}
                  </span>

          },
          {
            key: 'workplace',
            header: 'Workplace supervisor',
            render: (p) =>
            p.workplaceSupervisor ?
            <span className="text-[13px]">{p.workplaceSupervisor.fullName}</span> :

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setTarget(p);
                setChoice('');
              }}>
              
                      Assign
                    </Button>

          },
          {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (p) => <StatusBadge status={p.status} />
          }]
          }
          mobileCard={(p) =>
          <div className="flex items-start gap-3">
                <Avatar name={p.student.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-navy-900">
                    {p.student.fullName}
                  </p>
                  <p className="truncate text-[12px] text-slate-500">{p.opportunity.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {dateRange(p.startDate, p.endDate)}
                  </p>
                  {!p.workplaceSupervisor &&
              <Badge tone="pending" className="mt-1.5">
                      No workplace supervisor
                    </Badge>
              }
                </div>
                <StatusBadge status={p.status} />
              </div>
          } />

        }
      </Card>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Assign a workplace supervisor"
        description={target ? `${target.student.fullName} · ${target.opportunity.title}` : undefined}
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={assign.submitting}>
              Cancel
            </Button>
            <Button loading={assign.submitting} disabled={!choice} onClick={() => assign.run()}>
              Assign supervisor
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={assign.error} />
          {(supervisors.data?.length ?? 0) === 0 ?
          <CardBody className="px-0">
              <p className="text-[13px] text-slate-600">
                Add workplace supervisors on the Workplace supervisors page first.
              </p>
            </CardBody> :

          <Field label="Workplace supervisor" htmlFor="workplaceSupervisor" required>
              <Select
              id="workplaceSupervisor"
              value={choice}
              placeholder="Select a supervisor"
              onChange={(e) => setChoice(e.target.value)}
              options={(supervisors.data ?? []).map((w) => ({
                value: w.id,
                label: `${w.fullName} — ${w.jobTitle}`
              }))} />
            
            </Field>
          }
        </div>
      </Modal>
    </>);

}