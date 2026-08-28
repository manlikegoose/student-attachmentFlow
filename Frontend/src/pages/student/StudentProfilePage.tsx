import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input, Select, Textarea } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { getMyStudentProfile, updateStudentProfile } from '../../services/directoryService';
import { listDocuments } from '../../services/documentService';
import { profileCompletion } from '../../domain/rules';
import { useToast } from '../../contexts/ToastContext';
import { XIcon } from 'lucide-react';

export function StudentProfilePage() {
  const toast = useToast();
  const profile = useAsync(() => getMyStudentProfile(), []);
  const documents = useAsync(() => listDocuments(), []);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    faculty: '',
    department: '',
    programme: '',
    yearOfStudy: '3',
    expectedGraduation: '',
    bio: ''
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');

  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setForm({
      fullName: p.fullName,
      phone: p.phone,
      gender: p.gender ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
      address: p.address ?? '',
      faculty: p.faculty,
      department: p.department,
      programme: p.programme,
      yearOfStudy: String(p.yearOfStudy),
      expectedGraduation: p.expectedGraduation,
      bio: p.bio ?? ''
    });
    setSkills(p.skills);
  }, [profile.data]);

  const save = useMutation(async () => {
    const updated = await updateStudentProfile({
      fullName: form.fullName,
      phone: form.phone,
      gender: (form.gender || null) as 'MALE' | 'FEMALE' | 'OTHER' | null,
      dateOfBirth: form.dateOfBirth || null,
      address: form.address || null,
      faculty: form.faculty,
      department: form.department,
      programme: form.programme,
      yearOfStudy: Number(form.yearOfStudy),
      expectedGraduation: form.expectedGraduation,
      bio: form.bio || null,
      skills
    });
    profile.setData(updated);
    toast.success('Profile updated');
    return updated;
  });

  if (profile.loading && !profile.data) return <LoadingState rows={6} />;
  if (profile.error || !profile.data)
  return <ErrorState message={profile.error ?? undefined} onRetry={profile.refetch} />;

  const completion = profileCompletion(
    { ...form, skills, dateOfBirth: form.dateOfBirth },
    documents.data ?? []
  );

  return (
    <>
      <PageHeader
        title="My profile"
        description="Host organisations and the attachment office review this information before approving a placement." />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.run();
          }}>
          
          <FormError message={save.error} />

          <Card>
            <CardHeader title="Personal information" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" required error={save.fieldErrors.fullName}>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required />
                
              </Field>
              <Field label="Phone number" htmlFor="phone" required>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required />
                
              </Field>
              <Field label="Gender" htmlFor="gender">
                <Select
                  id="gender"
                  value={form.gender}
                  placeholder="Prefer not to say"
                  options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }]
                  }
                  onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                
              </Field>
              <Field label="Date of birth" htmlFor="dateOfBirth">
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                
              </Field>
              <Field label="Postal address" htmlFor="address" className="sm:col-span-2">
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="P.O. Box 1957, Kisumu" />
                
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Academic information"
              description={`Student number ${profile.data.studentNumber} · ${profile.data.university}`} />
            
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Faculty" htmlFor="faculty" required>
                <Input
                  id="faculty"
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  required />
                
              </Field>
              <Field label="Department" htmlFor="department" required>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  required />
                
              </Field>
              <Field label="Programme" htmlFor="programme" required>
                <Input
                  id="programme"
                  value={form.programme}
                  onChange={(e) => setForm({ ...form, programme: e.target.value })}
                  required />
                
              </Field>
              <Field
                label="Year of study"
                htmlFor="yearOfStudy"
                required
                error={save.fieldErrors.yearOfStudy}>
                
                <Select
                  id="yearOfStudy"
                  value={form.yearOfStudy}
                  options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))}
                  onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })} />
                
              </Field>
              <Field label="Expected graduation" htmlFor="expectedGraduation">
                <Input
                  id="expectedGraduation"
                  type="date"
                  value={form.expectedGraduation}
                  onChange={(e) => setForm({ ...form, expectedGraduation: e.target.value })} />
                
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Professional summary and skills"
              description="Reviewers read this alongside your CV." />
            
            <CardBody className="space-y-4">
              <Field label="Professional summary" htmlFor="bio">
                <Textarea
                  id="bio"
                  rows={5}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Third-year IT student focused on…" />
                
              </Field>

              <div>
                <label htmlFor="skill" className="block text-[13px] font-medium text-navy-900">
                  Skills
                </label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="skill"
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    placeholder="e.g. PostgreSQL"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = skillDraft.trim();
                        if (value && !skills.includes(value)) setSkills([...skills, value]);
                        setSkillDraft('');
                      }
                    }} />
                  
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const value = skillDraft.trim();
                      if (value && !skills.includes(value)) setSkills([...skills, value]);
                      setSkillDraft('');
                    }}>
                    
                    Add
                  </Button>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {skills.map((skill) =>
                  <li key={skill}>
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 py-0.5 pl-2.5 pr-1 text-[12px] text-slate-700">
                        {skill}
                        <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() => setSkills(skills.filter((s) => s !== skill))}
                        className="rounded-full p-0.5 text-slate-400 hover:text-rejected-fg">
                        
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={save.submitting}>
              Save profile
            </Button>
          </div>
        </form>

        <aside>
          <Card>
            <CardHeader title="Profile completion" />
            <CardBody>
              <ProgressBar
                value={completion.percent}
                tone={completion.percent === 100 ? 'approved' : 'navy'} />
              
              <ul className="mt-4 space-y-2">
                {completion.items.map((item) =>
                <li key={item.label} className="flex items-center gap-2 text-[13px]">
                    <span
                    className={
                    item.done ?
                    'h-1.5 w-1.5 rounded-full bg-approved-solid' :
                    'h-1.5 w-1.5 rounded-full bg-slate-300'
                    }
                    aria-hidden />
                  
                    <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700'}>
                      {item.label}
                    </span>
                  </li>
                )}
              </ul>
              {completion.percent < 100 &&
              <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
                  Outstanding document items are resolved from the{' '}
                  <Badge tone="muted">Documents</Badge> page.
                </p>
              }
            </CardBody>
          </Card>
        </aside>
      </div>
    </>);

}