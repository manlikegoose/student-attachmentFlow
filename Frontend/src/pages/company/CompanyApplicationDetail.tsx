import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { companyDecision, getApplication } from '../../services/applicationService';
import { getStudent } from '../../services/directoryService';
import { formatBytes } from '../../services/documentService';
import { dateRange, formatDate, formatDateTime } from '../../utils/format';
import { label } from '../../types/enums';
import { useToast } from '../../contexts/ToastContext';

export function CompanyApplicationDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const state = useAsync(() => getApplication(id), [id]);
  const student = useAsync(
    () => state.data ? getStudent(state.data.studentId) : Promise.resolve(null),
    [state.data?.studentId]
  );
  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');

  const decide = useMutation(async () => {
    const updated = await companyDecision(id, decision!, reason);
    state.setData(updated);
    toast.success(
      decision === 'ACCEPT' ? 'Applicant accepted' : 'Applicant declined',
      decision === 'ACCEPT' ?
      'The application has been forwarded to the university for approval.' :
      'The student has been notified.'
    );
    setDecision(null);
    setReason('');
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data)
  return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const a = state.data;
  const canDecide = ['SUBMITTED', 'UNDER_COMPANY_REVIEW'].includes(a.status);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Applicants', to: '/company/applications' }, { label: a.student.fullName }]}
        title={a.student.fullName}
        description={`${a.student.programme} · Year ${a.student.yearOfStudy} · ${a.student.studentNumber}`}
        meta={<StatusBadge status={a.status} />}
        actions={
        canDecide &&
        <>
              <Button
            variant="secondary"
            icon={<XIcon className="h-3.5 w-3.5" />}
            onClick={() => setDecision('REJECT')}>
            
                Decline
              </Button>
              <Button icon={<CheckIcon className="h-4 w-4" />} onClick={() => setDecision('ACCEPT')}>
                Accept applicant
              </Button>
            </>

        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Cover letter" />
            <CardBody>
              <Prose text={a.coverLetter} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Documents"
              description="Shared with you because this student applied to your organisation." />
            
            {a.documents.length === 0 ?
            <CardBody>
                <p className="text-[13px] text-slate-500">No documents were attached.</p>
              </CardBody> :

            <ul className="divide-y divide-slate-100">
                {a.documents.map((doc) =>
              <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-navy-900">{label(doc.type)}</p>
                      <p className="truncate text-[12px] text-slate-500">
                        {doc.filename} · {formatBytes(doc.sizeBytes)}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </li>
              )}
              </ul>
            }
          </Card>

          {student.data &&
          <Card>
              <CardHeader title="Student profile" />
              <CardBody>
                <DescriptionList
                items={[
                { label: 'Department', value: student.data.department },
                { label: 'Faculty', value: student.data.faculty },
                { label: 'University', value: student.data.university },
                {
                  label: 'Expected graduation',
                  value: formatDate(student.data.expectedGraduation)
                },
                { label: 'Email', value: student.data.email },
                { label: 'Phone', value: student.data.phone },
                { label: 'Professional summary', value: student.data.bio ?? '—', span: true }]
                } />
              
                {student.data.skills.length > 0 &&
              <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                    {student.data.skills.map((s) =>
                <li key={s}>
                        <Badge>{s}</Badge>
                      </li>
                )}
                  </ul>
              }
              </CardBody>
            </Card>
          }
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Application" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={a.student.fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-900">{a.student.fullName}</p>
                  <p className="text-[12px] text-slate-500">{a.student.email}</p>
                </div>
              </div>
              <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Opportunity', value: a.opportunity.title },
                { label: 'Department', value: a.opportunity.department },
                {
                  label: 'Placement dates',
                  value: dateRange(a.opportunity.startDate, a.opportunity.endDate)
                },
                { label: 'Submitted', value: formatDateTime(a.submittedAt) },
                {
                  label: 'Your decision',
                  value: a.companyDecisionAt ?
                  `${formatDate(a.companyDecisionAt)} — ${a.companyDecisionReason ?? 'No reason recorded'}` :
                  'Not yet decided'
                }]
                } />
              
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision === 'ACCEPT' ? 'Accept this applicant' : 'Decline this applicant'}
        description={
        decision === 'ACCEPT' ?
        'The application moves to university review. The attachment office decides on final approval.' :
        'The student will be notified with the reason you give.'
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={decide.submitting}>
              Cancel
            </Button>
            <Button
            variant={decision === 'REJECT' ? 'danger' : 'primary'}
            loading={decide.submitting}
            onClick={() => decide.run()}>
            
              {decision === 'ACCEPT' ? 'Accept applicant' : 'Decline applicant'}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <FormError message={decide.error} />
          <Field
            label={decision === 'ACCEPT' ? 'Note (optional)' : 'Reason'}
            htmlFor="reason"
            required={decision === 'REJECT'}
            error={decide.fieldErrors.reason}>
            
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
              decision === 'ACCEPT' ?
              'Strong security fundamentals and clear written communication.' :
              'Explain briefly why the application is not proceeding.'
              } />
            
          </Field>
        </div>
      </Modal>
    </>);

}