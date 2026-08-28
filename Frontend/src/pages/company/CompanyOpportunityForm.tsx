import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input, Select, Textarea } from '../../components/ui/Form';
import { LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  createOpportunity,
  getOpportunity,
  updateOpportunity } from
'../../services/opportunityService';
import type { OpportunityInput } from '../../services/opportunityService';
import { getMyCompanyProfile } from '../../services/directoryService';
import { WORK_MODES, label } from '../../types/enums';
import type { WorkMode } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = {
  title: '',
  description: '',
  department: '',
  workMode: 'ONSITE' as WorkMode,
  startDate: '',
  endDate: '',
  durationWeeks: '12',
  slots: '2',
  applicationDeadline: '',
  requirements: '',
  preferredSkills: '',
  responsibilities: ''
};

const toLines = (value: string) =>
value.
split('\n').
map((l) => l.trim()).
filter(Boolean);

export function CompanyOpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = !!id;

  const company = useAsync(() => getMyCompanyProfile(), []);
  const existing = useAsync(
    () => id ? getOpportunity(id) : Promise.resolve(null),
    [id]
  );
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    const o = existing.data;
    if (!o) return;
    setForm({
      title: o.title,
      description: o.description,
      department: o.department,
      workMode: o.workMode,
      startDate: o.startDate,
      endDate: o.endDate,
      durationWeeks: String(o.durationWeeks),
      slots: String(o.slots),
      applicationDeadline: o.applicationDeadline,
      requirements: o.requirements.join('\n'),
      preferredSkills: o.preferredSkills.join('\n'),
      responsibilities: o.responsibilities.join('\n')
    });
  }, [existing.data]);

  const buildPayload = (): OpportunityInput => ({
    title: form.title,
    description: form.description,
    department: form.department,
    industry: company.data?.industry ?? '',
    location: company.data?.location ?? '',
    town: company.data?.town ?? '',
    workMode: form.workMode,
    startDate: form.startDate,
    endDate: form.endDate,
    durationWeeks: Number(form.durationWeeks),
    slots: Number(form.slots),
    applicationDeadline: form.applicationDeadline,
    requirements: toLines(form.requirements),
    preferredSkills: toLines(form.preferredSkills),
    responsibilities: toLines(form.responsibilities)
  });

  const save = useMutation(async (submit: boolean) => {
    const payload = buildPayload();
    const record = editing ?
    await updateOpportunity(id!, payload) :
    await createOpportunity(payload, submit);
    toast.success(
      editing ? 'Opportunity updated' : submit ? 'Submitted for approval' : 'Draft saved',
      submit && !editing ?
      'The attachment office will review it before it becomes visible to students.' :
      undefined
    );
    navigate(`/company/opportunities/${record.id}`);
    return record;
  });

  if (editing && existing.loading && !existing.data) return <LoadingState rows={6} />;

  const set = (key: keyof typeof form) => (value: string) =>
  setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        breadcrumbs={[
        { label: 'Opportunities', to: '/company/opportunities' },
        { label: editing ? 'Edit' : 'New opportunity' }]
        }
        title={editing ? 'Edit opportunity' : 'New opportunity'}
        description="Students see this posting once the attachment office approves it." />
      

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(true);
        }}>
        
        <FormError message={save.error} />

        <Card>
          <CardHeader title="Overview" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="title" required error={save.fieldErrors.title}>
              <Input id="title" value={form.title} onChange={(e) => set('title')(e.target.value)} required />
            </Field>
            <Field label="Department" htmlFor="department" required>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => set('department')(e.target.value)}
                required />
              
            </Field>
            <Field
              label="Description"
              htmlFor="description"
              required
              error={save.fieldErrors.description}
              className="sm:col-span-2"
              hint="At least 40 characters.">
              
              <Textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(e) => set('description')(e.target.value)} />
              
            </Field>
            <Field label="Work mode" htmlFor="workMode" required>
              <Select
                id="workMode"
                value={form.workMode}
                options={WORK_MODES.map((m) => ({ value: m, label: label(m) }))}
                onChange={(e) => set('workMode')(e.target.value)} />
              
            </Field>
            <Field label="Available slots" htmlFor="slots" required error={save.fieldErrors.slots}>
              <Input
                id="slots"
                type="number"
                min={1}
                max={50}
                value={form.slots}
                onChange={(e) => set('slots')(e.target.value)} />
              
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dates" />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Field label="Start date" htmlFor="startDate" required error={save.fieldErrors.startDate}>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate')(e.target.value)} />
              
            </Field>
            <Field label="End date" htmlFor="endDate" required error={save.fieldErrors.endDate}>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate')(e.target.value)} />
              
            </Field>
            <Field
              label="Application deadline"
              htmlFor="applicationDeadline"
              required
              error={save.fieldErrors.applicationDeadline}>
              
              <Input
                id="applicationDeadline"
                type="date"
                value={form.applicationDeadline}
                onChange={(e) => set('applicationDeadline')(e.target.value)} />
              
            </Field>
            <Field label="Duration (weeks)" htmlFor="durationWeeks" required>
              <Input
                id="durationWeeks"
                type="number"
                min={1}
                max={52}
                value={form.durationWeeks}
                onChange={(e) => set('durationWeeks')(e.target.value)} />
              
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Detail" description="One item per line." />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Field label="Responsibilities" htmlFor="responsibilities">
              <Textarea
                id="responsibilities"
                rows={6}
                value={form.responsibilities}
                onChange={(e) => set('responsibilities')(e.target.value)} />
              
            </Field>
            <Field label="Requirements" htmlFor="requirements">
              <Textarea
                id="requirements"
                rows={6}
                value={form.requirements}
                onChange={(e) => set('requirements')(e.target.value)} />
              
            </Field>
            <Field label="Preferred skills" htmlFor="preferredSkills">
              <Textarea
                id="preferredSkills"
                rows={6}
                value={form.preferredSkills}
                onChange={(e) => set('preferredSkills')(e.target.value)} />
              
            </Field>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/company/opportunities')}>
            Cancel
          </Button>
          {!editing &&
          <Button variant="secondary" loading={save.submitting} onClick={() => save.run(false)}>
              Save as draft
            </Button>
          }
          <Button type="submit" size="lg" loading={save.submitting}>
            {editing ? 'Save changes' : 'Submit for approval'}
          </Button>
        </div>
      </form>
    </>);

}