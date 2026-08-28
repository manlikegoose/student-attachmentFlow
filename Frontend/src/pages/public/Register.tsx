import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2Icon, GraduationCapIcon, InfoIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input, Select } from '../../components/ui/Form';
import { HOME_ROUTES, useAuth } from '../../contexts/AuthContext';
import { useMutation } from '../../hooks/useAsync';
import { UNIVERSITY } from '../../data/seedPeople';

type Mode = 'STUDENT' | 'COMPANY';

const TOWNS = ['Nairobi', 'Nakuru', 'Eldoret', 'Nyeri', 'Kisumu'];
const INDUSTRIES = [
'Software & IT Services',
'Network & Infrastructure',
'Data & Analytics',
'Telecommunications',
'Agritech',
'Fintech',
'Manufacturing',
'Other'];


export function Register() {
  const [mode, setMode] = useState<Mode>('STUDENT');

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Create an account</h1>
        <p className="mt-2 text-[13px] text-slate-600">
          Choose the account type that applies to you.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
          {
          [
          {
            id: 'STUDENT' as Mode,
            icon: GraduationCapIcon,
            title: 'Student',
            body: 'Apply for attachment and track your placement.'
          },
          {
            id: 'COMPANY' as Mode,
            icon: Building2Icon,
            title: 'Host organisation',
            body: 'Publish opportunities once verified by the university.'
          }].

          map((option) =>
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors duration-150 ease-smooth',
              mode === option.id ?
              'border-navy-600 bg-navy-50' :
              'border-slate-200 bg-white hover:border-slate-300'
            )}>
            
              <option.icon className="h-5 w-5 text-navy-600" aria-hidden />
              <p className="mt-2 text-[14px] font-semibold text-navy-900">{option.title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">{option.body}</p>
            </button>
          )}
        </div>

        <div className="mt-8">
          {mode === 'STUDENT' ? <StudentForm /> : <CompanyForm />}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            Coordinator and supervisor accounts cannot be created here. They are provisioned by
            authorised university staff.
          </p>
        </div>

        <p className="mt-6 text-[13px] text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-navy-600 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </PublicLayout>);

}

function StudentForm() {
  const navigate = useNavigate();
  const { registerStudent } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    studentNumber: '',
    university: UNIVERSITY,
    programme: '',
    yearOfStudy: '3'
  });
  const set = (key: keyof typeof form) => (value: string) =>
  setForm((current) => ({ ...current, [key]: value }));

  const { run, submitting, error, fieldErrors } = useMutation(async () => {
    const session = await registerStudent({
      ...form,
      yearOfStudy: Number(form.yearOfStudy)
    });
    navigate(HOME_ROUTES[session.role], { replace: true });
    return session;
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}>
      
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required error={fieldErrors.fullName}>
          <Input id="fullName" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} required />
        </Field>
        <Field label="Student number" htmlFor="studentNumber" required error={fieldErrors.studentNumber}>
          <Input
            id="studentNumber"
            value={form.studentNumber}
            onChange={(e) => set('studentNumber')(e.target.value)}
            placeholder="ADM/IT/1042/2023"
            required />
          
        </Field>
        <Field label="Email address" htmlFor="email" required error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            value={form.email}
            invalid={!!fieldErrors.email}
            onChange={(e) => set('email')(e.target.value)}
            required />
          
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={fieldErrors.phone}>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
            placeholder="+254 7xx xxx xxx"
            required />
          
        </Field>
        <Field label="University" htmlFor="university" required error={fieldErrors.university}>
          <Input id="university" value={form.university} onChange={(e) => set('university')(e.target.value)} required />
        </Field>
        <Field label="Programme" htmlFor="programme" required error={fieldErrors.programme}>
          <Input
            id="programme"
            value={form.programme}
            onChange={(e) => set('programme')(e.target.value)}
            placeholder="BSc Information Technology"
            required />
          
        </Field>
        <Field label="Year of study" htmlFor="yearOfStudy" required error={fieldErrors.yearOfStudy}>
          <Select
            id="yearOfStudy"
            value={form.yearOfStudy}
            onChange={(e) => set('yearOfStudy')(e.target.value)}
            options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))} />
          
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          required
          error={fieldErrors.password}
          hint="At least 8 characters.">
          
          <Input
            id="password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            required />
          
        </Field>
      </div>
      <Button type="submit" size="lg" fullWidth loading={submitting}>
        Create student account
      </Button>
    </form>);

}

function CompanyForm() {
  const navigate = useNavigate();
  const { registerCompany } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    town: 'Nairobi',
    industry: INDUSTRIES[0]
  });
  const set = (key: keyof typeof form) => (value: string) =>
  setForm((current) => ({ ...current, [key]: value }));

  const { run, submitting, error, fieldErrors } = useMutation(async () => {
    const session = await registerCompany(form);
    navigate(HOME_ROUTES[session.role], { replace: true });
    return session;
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}>
      
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={form.name} onChange={(e) => set('name')(e.target.value)} required />
        </Field>
        <Field label="Industry" htmlFor="industry" required>
          <Select
            id="industry"
            value={form.industry}
            onChange={(e) => set('industry')(e.target.value)}
            options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
          
        </Field>
        <Field label="Email address" htmlFor="companyEmail" required error={fieldErrors.email}>
          <Input
            id="companyEmail"
            type="email"
            value={form.email}
            invalid={!!fieldErrors.email}
            onChange={(e) => set('email')(e.target.value)}
            required />
          
        </Field>
        <Field label="Phone number" htmlFor="companyPhone" required error={fieldErrors.phone}>
          <Input id="companyPhone" value={form.phone} onChange={(e) => set('phone')(e.target.value)} required />
        </Field>
        <Field label="Physical address" htmlFor="location" required error={fieldErrors.location}>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => set('location')(e.target.value)}
            placeholder="Westlands, Nairobi"
            required />
          
        </Field>
        <Field label="Town" htmlFor="town" required>
          <Select
            id="town"
            value={form.town}
            onChange={(e) => set('town')(e.target.value)}
            options={TOWNS.map((t) => ({ value: t, label: t }))} />
          
        </Field>
        <Field
          label="Password"
          htmlFor="companyPassword"
          required
          error={fieldErrors.password}
          hint="At least 8 characters."
          className="sm:col-span-2">
          
          <Input
            id="companyPassword"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            required />
          
        </Field>
      </div>
      <Button type="submit" size="lg" fullWidth loading={submitting}>
        Create organisation account
      </Button>
    </form>);

}