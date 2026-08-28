import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRoundIcon } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input } from '../../components/ui/Form';
import { Avatar } from '../../components/ui/Avatar';
import { HOME_ROUTES, useAuth } from '../../contexts/AuthContext';
import { useMutation } from '../../hooks/useAsync';
import { DEMO_PASSWORD } from '../../data/seedPeople';
import { label } from '../../types/enums';

/** The personas the demonstration walks through, in the order the panel sees them. */
const DEMO_PERSONAS = [
{ email: 'victor.kiplangat@student.university.edu', name: 'Victor Kiplangat', role: 'STUDENT', note: 'Applies for a placement' },
{ email: 'attachments@dumutech.co.ke', name: 'DumuTech Ltd.', role: 'COMPANY', note: 'Reviews and accepts applicants' },
{ email: 'attachments@university.edu', name: 'Mrs. Esther Muriithi', role: 'COORDINATOR', note: 'Approves and assigns supervisors' },
{ email: 'j.wanjiku@university.edu', name: 'Dr. Jane Wanjiku', role: 'SUPERVISOR', note: 'Supervises and evaluates' }];


export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as {from?: string;} | null)?.from;

  const signIn = useMutation(async (address: string, secret: string) => {
    const session = await login(address, secret);
    navigate(from ?? HOME_ROUTES[session.role], { replace: true });
    return session;
  });

  const demoSignIn = useMutation(async (address: string) => {
    const session = await loginAsDemo(address);
    navigate(HOME_ROUTES[session.role], { replace: true });
    return session;
  });

  return (
    <PublicLayout>
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-20">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Sign in</h1>
          <p className="mt-2 text-[13px] text-slate-600">
            Student and host organisation accounts are self-registered. Coordinator and supervisor
            accounts are created by the attachment office.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn.run(email, password);
            }}>
            
            <FormError message={signIn.error} />
            <Field label="Email address" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required />
              
            </Field>
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
              
            </Field>
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium text-navy-600 underline underline-offset-2">
                
                Forgot your password?
              </Link>
            </div>
            <Button type="submit" fullWidth size="lg" loading={signIn.submitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-[13px] text-slate-600">
            Don’t have an account?{' '}
            <Link to="/register" className="font-medium text-navy-600 underline underline-offset-2">
              Register as a student or organisation
            </Link>
          </p>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 className="text-[13px] font-semibold text-navy-900">Demonstration accounts</h2>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
            Sign in as any role to walk the full lifecycle. All seeded accounts share the password{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-navy-800">
              {DEMO_PASSWORD}
            </code>
            .
          </p>
          <ul className="mt-4 space-y-2">
            {DEMO_PERSONAS.map((persona) =>
            <li key={persona.email}>
                <button
                type="button"
                disabled={demoSignIn.submitting}
                onClick={() => demoSignIn.run(persona.email)}
                className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5 text-left transition-colors duration-150 ease-smooth hover:border-navy-300 disabled:opacity-60">
                
                  <Avatar name={persona.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-navy-900">
                      {persona.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {label(persona.role)} · {persona.note}
                    </span>
                  </span>
                </button>
              </li>
            )}
          </ul>
          <FormError message={demoSignIn.error} />
        </aside>
      </div>
    </PublicLayout>);

}