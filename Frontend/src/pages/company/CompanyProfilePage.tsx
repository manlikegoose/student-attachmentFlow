import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input, Textarea } from '../../components/ui/Form';
import { VerificationBadge } from '../../components/ui/Badge';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { CompanyLogo } from '../../components/ui/Avatar';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import {
  getMyCompanyProfile,
  submitForVerification,
  updateCompanyProfile } from
'../../services/directoryService';
import { formatDate } from '../../utils/format';
import { useToast } from '../../contexts/ToastContext';

export function CompanyProfilePage() {
  const toast = useToast();
  const state = useAsync(() => getMyCompanyProfile(), []);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    industry: '',
    location: '',
    town: '',
    website: '',
    registrationNumber: '',
    description: ''
  });

  useEffect(() => {
    const c = state.data;
    if (!c) return;
    setForm({
      name: c.name,
      phone: c.phone,
      industry: c.industry,
      location: c.location,
      town: c.town,
      website: c.website ?? '',
      registrationNumber: c.registrationNumber ?? '',
      description: c.description
    });
  }, [state.data]);

  const save = useMutation(async () => {
    const updated = await updateCompanyProfile({
      ...form,
      website: form.website || null,
      registrationNumber: form.registrationNumber || null
    });
    state.setData(updated);
    toast.success('Company profile updated');
    return updated;
  });

  const submit = useMutation(async () => {
    const updated = await submitForVerification();
    state.setData(updated);
    toast.success('Submitted for verification', 'The attachment office will review your details.');
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const company = state.data;
  const canSubmit = company.verificationStatus !== 'VERIFIED';

  return (
    <>
      <PageHeader
        title="Company profile"
        description="Students and the attachment office see this information on every opportunity you publish."
        meta={<VerificationBadge status={company.verificationStatus} />} />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.run();
          }}>
          
          <FormError message={save.error} />
          <Card>
            <CardHeader title="Organisation details" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation name" htmlFor="name" required error={save.fieldErrors.name}>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required />
                
              </Field>
              <Field label="Industry" htmlFor="industry" required>
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  required />
                
              </Field>
              <Field label="Phone number" htmlFor="phone" required>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required />
                
              </Field>
              <Field label="Website" htmlFor="website">
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://" />
                
              </Field>
              <Field label="Physical address" htmlFor="location" required>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required />
                
              </Field>
              <Field label="Town" htmlFor="town" required>
                <Input
                  id="town"
                  value={form.town}
                  onChange={(e) => setForm({ ...form, town: e.target.value })}
                  required />
                
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verification information"
              description="Reviewed by the attachment office before you can publish opportunities." />
            
            <CardBody className="space-y-4">
              <Field
                label="Company registration number"
                htmlFor="registrationNumber"
                required
                error={save.fieldErrors.registrationNumber ?? submit.fieldErrors.registrationNumber}
                hint="As it appears on your certificate of incorporation.">
                
                <Input
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
                
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                required
                error={save.fieldErrors.description ?? submit.fieldErrors.description}
                hint="At least 40 characters. Describe what your organisation does and what attachés work on.">
                
                <Textarea
                  id="description"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
                
              </Field>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={save.submitting}>
              Save profile
            </Button>
          </div>
        </form>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Verification status" />
            <CardBody>
              <div className="flex items-center gap-3">
                <CompanyLogo logoText={company.logoText} size="lg" />
                <VerificationBadge status={company.verificationStatus} />
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Registered', value: formatDate(company.createdAt) },
                {
                  label: 'Verified on',
                  value: company.verifiedAt ? formatDate(company.verifiedAt) : '—'
                },
                { label: 'Reviewer notes', value: company.verificationNotes ?? '—' }]
                } />
              
              {canSubmit &&
              <>
                  <FormError message={submit.error} />
                  <Button
                  className="mt-4"
                  fullWidth
                  icon={<ShieldCheckIcon className="h-4 w-4" />}
                  loading={submit.submitting}
                  onClick={() => submit.run()}>
                  
                    Submit for verification
                  </Button>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                    Save your registration number and description first — both are required.
                  </p>
                </>
              }
            </CardBody>
          </Card>
        </aside>
      </div>
    </>);

}