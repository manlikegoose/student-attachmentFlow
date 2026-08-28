import React, { useState } from 'react';
import { PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Input } from '../../components/ui/Form';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  createWorkplaceSupervisor,
  deleteWorkplaceSupervisor,
  listWorkplaceSupervisors } from
'../../services/directoryService';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { fullName: '', jobTitle: '', email: '', phone: '', department: '' };

export function CompanyWorkplaceSupervisors() {
  const toast = useToast();
  const state = useAsync(() => listWorkplaceSupervisors(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const create = useMutation(async () => {
    await createWorkplaceSupervisor(form);
    toast.success('Workplace supervisor added');
    setForm(EMPTY);
    setOpen(false);
    state.refetch();
  });

  const remove = useMutation(async (id: string) => {
    await deleteWorkplaceSupervisor(id);
    toast.success('Workplace supervisor removed');
    state.refetch();
  });

  const rows = state.data ?? [];

  return (
    <>
      <PageHeader
        title="Workplace supervisors"
        description="Staff in your organisation who mentor attachés day to day. Assign them to interns from the Interns page."
        actions={
        <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Add supervisor
          </Button>
        } />
      

      {remove.error &&
      <div className="mb-5 rounded-md border border-rejected-border bg-rejected-bg px-4 py-3 text-[13px] text-rejected-fg">
          {remove.error}
        </div>
      }

      <Card>
        {state.loading && !state.data ?
        <LoadingState rows={3} /> :
        state.error ?
        <ErrorState message={state.error} onRetry={state.refetch} /> :
        rows.length === 0 ?
        <EmptyState
          icon={<UsersIcon className="h-5 w-5" />}
          title="No workplace supervisors"
          description="Add the staff who will mentor your attachés so the university knows who to contact."
          action={<Button size="sm" onClick={() => setOpen(true)}>Add a supervisor</Button>} /> :


        <ul className="divide-y divide-slate-100">
            {rows.map((w) =>
          <li key={w.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Avatar name={w.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-navy-900">{w.fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">
                    {w.jobTitle} · {w.department}
                  </p>
                  <p className="truncate text-[12px] text-slate-500">
                    {w.email} · {w.phone}
                  </p>
                </div>
                <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove ${w.fullName}`}
              icon={<Trash2Icon className="h-3.5 w-3.5" />}
              loading={remove.submitting}
              onClick={() => remove.run(w.id)} />
            
              </li>
          )}
          </ul>
        }
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a workplace supervisor"
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={create.submitting}>
              Cancel
            </Button>
            <Button loading={create.submitting} onClick={() => create.run()}>
              Add supervisor
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={create.error} />
          <Field label="Full name" htmlFor="fullName" required error={create.fieldErrors.fullName}>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            
          </Field>
          <Field label="Job title" htmlFor="jobTitle" required>
            <Input
              id="jobTitle"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            
          </Field>
          <Field label="Department" htmlFor="department" required>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })} />
            
          </Field>
          <Field label="Email address" htmlFor="email" required error={create.fieldErrors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            
          </Field>
          <Field label="Phone number" htmlFor="phone" required>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            
          </Field>
        </div>
      </Modal>
    </>);

}