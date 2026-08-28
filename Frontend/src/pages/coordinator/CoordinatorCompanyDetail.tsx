import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheckIcon, ShieldXIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { VerificationBadge } from '../../components/ui/Badge';
import { CompanyLogo } from '../../components/ui/Avatar';
import { DescriptionList, Prose } from '../../components/ui/DescriptionList';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { OpportunityCard } from '../../components/domain/OpportunityCard';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { decideVerification, getCompany } from '../../services/directoryService';
import { listOpportunities } from '../../services/opportunityService';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';

export function CoordinatorCompanyDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');

  const state = useAsync(() => getCompany(id), [id]);
  const postings = useAsync(() => listOpportunities({ companyId: id, pageSize: 6 }), [id]);

  const mutation = useMutation(async (outcome: 'VERIFIED' | 'REJECTED') => {
    const updated = await decideVerification(id, outcome, notes);
    toast.success(
      outcome === 'VERIFIED' ? 'Organisation verified' : 'Verification declined',
      outcome === 'VERIFIED' ?
      `${updated.name} can now publish opportunities.` :
      `${updated.name} has been notified with your reason.`
    );
    setDecision(null);
    setNotes('');
    state.refetch();
    return updated;
  });

  if (state.loading && !state.data) return <LoadingState rows={5} />;
  if (state.error || !state.data) return <ErrorState message={state.error ?? undefined} onRetry={state.refetch} />;

  const company = state.data;
  const canDecide = company.verificationStatus === 'PENDING_VERIFICATION';

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Companies', to: '/coordinator/companies' }, { label: company.name }]}
        title={company.name}
        description={`${company.industry} · ${company.location}`}
        meta={<VerificationBadge status={company.verificationStatus} />}
        actions={
        canDecide ?
        <>
              <Button
            variant="secondary"
            icon={<ShieldXIcon className="h-4 w-4" />}
            onClick={() => setDecision('REJECTED')}>
            
                Decline
              </Button>
              <Button icon={<ShieldCheckIcon className="h-4 w-4" />} onClick={() => setDecision('VERIFIED')}>
                Verify organisation
              </Button>
            </> :
        null
        } />
      

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="About the organisation" />
            <CardBody>
              <Prose text={company.description} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Opportunities"
              description="Postings submitted by this organisation across all statuses" />
            
            <CardBody>
              {postings.data && postings.data.results.length > 0 ?
              <ul className="grid gap-4 sm:grid-cols-2">
                  {postings.data.results.map((o) =>
                <li key={o.id}>
                      <OpportunityCard
                    opportunity={o}
                    to="/coordinator/opportunities"
                    showStatus />
                  
                    </li>
                )}
                </ul> :

              <p className="text-[13px] text-slate-500">
                  This organisation has not created any postings yet.
                </p>
              }
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Verification record" />
            <CardBody>
              <div className="mb-4 flex items-center gap-3">
                <CompanyLogo logoText={company.logoText} size="lg" />
                <VerificationBadge status={company.verificationStatus} />
              </div>
              <DescriptionList
                columns={1}
                items={[
                { label: 'Registration number', value: company.registrationNumber ?? 'Not supplied' },
                { label: 'Registered on', value: formatDate(company.createdAt) },
                { label: 'Verified on', value: company.verifiedAt ? formatDate(company.verifiedAt) : '—' },
                { label: 'Reviewer notes', value: company.verificationNotes ?? '—' }]
                } />
              
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                { label: 'Email', value: company.email },
                { label: 'Phone', value: company.phone },
                { label: 'Website', value: company.website ?? '—' },
                { label: 'Town', value: company.town }]
                } />
              
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision === 'VERIFIED' ? 'Verify organisation' : 'Decline verification'}
        description={
        decision === 'VERIFIED' ?
        'Verified organisations may publish attachment opportunities.' :
        'The organisation will be notified with the reason you record here.'
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={mutation.submitting}>
              Cancel
            </Button>
            <Button
            variant={decision === 'REJECTED' ? 'danger' : 'primary'}
            loading={mutation.submitting}
            onClick={() => decision && mutation.run(decision)}>
            
              {decision === 'VERIFIED' ? 'Verify' : 'Decline'}
            </Button>
          </>
        }>
        
        <div className="space-y-3">
          <FormError message={mutation.error} />
          <Field
            label={decision === 'VERIFIED' ? 'Notes (optional)' : 'Reason'}
            htmlFor="notes"
            required={decision === 'REJECTED'}
            error={mutation.fieldErrors.notes}>
            
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
              decision === 'VERIFIED' ?
              'Certificate of incorporation and KRA PIN checked against the registry.' :
              'Explain what is missing or could not be confirmed.'
              } />
            
          </Field>
        </div>
      </Modal>
    </>);

}