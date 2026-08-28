import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InfoIcon } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input } from '../../components/ui/Form';
import { useMutation } from '../../hooks/useAsync';
import { requestPasswordReset } from '../../services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const { run, submitting, error, fieldErrors } = useMutation(requestPasswordReset);

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Reset your password</h1>
        <p className="mt-2 text-[13px] text-slate-600">
          Enter the email address linked to your account and we will send reset instructions.
        </p>

        {sent ?
        <div className="mt-6 rounded-md border border-approved-border bg-approved-bg px-4 py-3 text-[13px] text-approved-fg">
            {sent}
          </div> :

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await run(email);
            if (result) setSent(result.detail);
          }}>
          
            <FormError message={error} />
            <Field label="Email address" htmlFor="email" error={fieldErrors.email} required>
              <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              invalid={!!fieldErrors.email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required />
            
            </Field>
            <Button type="submit" fullWidth loading={submitting}>
              Send reset instructions
            </Button>
          </form>
        }

        <div className="mt-6 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            Password reset is architected but not delivered in this build. The backend issues a
            signed, single-use token by email; this screen collects the address and reports the
            outcome without confirming whether an account exists.
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-600">
          <Link to="/login" className="font-medium text-navy-600 underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </div>
    </PublicLayout>);

}