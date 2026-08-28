import React, { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input } from '../../components/ui/Form';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMutation } from '../../hooks/useAsync';
import { changeOwnPassword } from '../../services/authService';
import { label } from '../../types/enums';
import { formatDateTime } from '../../utils/format';

export function SettingsPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState<string | null>(null);

  const { run, submitting, error, fieldErrors } = useMutation(changeOwnPassword);

  if (!session) return null;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account details and password. Profile information is managed on your profile page." />
      

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <DescriptionList
              columns={1}
              items={[
              { label: 'Name', value: session.user.fullName },
              { label: 'Email address', value: session.user.email },
              { label: 'Phone', value: session.user.phone },
              { label: 'Role', value: label(session.role) },
              { label: 'Last sign-in', value: formatDateTime(session.user.lastLogin) }]
              } />
            
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" description="Minimum eight characters." />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setMismatch(null);
                if (next !== confirm) {
                  setMismatch('The new passwords do not match.');
                  return;
                }
                const result = await run(current, next);
                if (result !== null) {
                  toast.success('Password updated');
                  setCurrent('');
                  setNext('');
                  setConfirm('');
                }
              }}>
              
              <FormError message={mismatch ?? error} />
              <Field
                label="Current password"
                htmlFor="currentPassword"
                required
                error={fieldErrors.currentPassword}>
                
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required />
                
              </Field>
              <Field label="New password" htmlFor="newPassword" required error={fieldErrors.newPassword}>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  required />
                
              </Field>
              <Field label="Confirm new password" htmlFor="confirmPassword" required>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required />
                
              </Field>
              <Button type="submit" loading={submitting}>
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-slate-200 bg-white px-4 py-3.5 text-[12px] leading-relaxed text-slate-600">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <p>
          Notification channel preferences (email, SMS, WhatsApp) are on the Phase 2 roadmap. This
          build delivers in-app notifications only, and the notification service is written as a
          single seam so those channels can be added without touching workflow code.
        </p>
      </div>
    </>);

}