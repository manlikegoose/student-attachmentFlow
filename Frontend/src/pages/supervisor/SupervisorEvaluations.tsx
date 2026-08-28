import React, { useState } from 'react';
import { AwardIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Field, FormError, Textarea } from '../../components/ui/Form';
import { RatingInput, RatingDisplay } from '../../components/ui/RatingInput';
import { DescriptionList } from '../../components/ui/DescriptionList';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync, useMutation } from '../../hooks/useAsync';
import { listPlacements } from '../../services/placementService';
import { submitEvaluation } from '../../services/evaluationService';
import { computeFinalScore, recommendationForScore } from '../../domain/rules';
import { dateRange, formatDate } from '../../utils/format';
import { label } from '../../types/enums';
import type { EvaluationScores } from '../../types/models';
import type { PlacementView } from '../../types/views';
import { useToast } from '../../contexts/ToastContext';

const CRITERIA: {key: keyof EvaluationScores;label: string;}[] = [
{ key: 'technicalSkills', label: 'Technical skills' },
{ key: 'communication', label: 'Communication' },
{ key: 'teamwork', label: 'Teamwork' },
{ key: 'professionalism', label: 'Professionalism' },
{ key: 'punctuality', label: 'Punctuality' },
{ key: 'problemSolving', label: 'Problem solving' },
{ key: 'adaptability', label: 'Adaptability' },
{ key: 'overallPerformance', label: 'Overall performance' }];


const EMPTY_SCORES: EvaluationScores = {
  technicalSkills: 3,
  communication: 3,
  teamwork: 3,
  professionalism: 3,
  punctuality: 3,
  problemSolving: 3,
  adaptability: 3,
  overallPerformance: 3
};

export function SupervisorEvaluations() {
  const toast = useToast();
  const state = useAsync(() => listPlacements({ pageSize: 50 }), []);
  const [target, setTarget] = useState<PlacementView | null>(null);
  const [scores, setScores] = useState<EvaluationScores>(EMPTY_SCORES);
  const [text, setText] = useState({
    strengths: '',
    weaknesses: '',
    recommendations: '',
    overallComments: ''
  });

  const save = useMutation(async () => {
    const record = await submitEvaluation({ placementId: target!.id, scores, ...text });
    toast.success(
      'Evaluation submitted',
      `Final score ${record.finalScore.toFixed(1)} / 5 — ${label(record.recommendation)}.`
    );
    setTarget(null);
    setScores(EMPTY_SCORES);
    setText({ strengths: '', weaknesses: '', recommendations: '', overallComments: '' });
    state.refetch();
    return record;
  });

  const rows = (state.data?.results ?? []).filter((p) =>
  ['ACTIVE', 'COMPLETED'].includes(p.status)
  );
  const preview = computeFinalScore(scores);

  return (
    <>
      <PageHeader
        title="Final evaluations"
        description="One locked evaluation per placement, scored across eight areas. The overall score determines the recommendation." />
      

      {state.loading && !state.data ?
      <LoadingState rows={4} /> :
      state.error ?
      <ErrorState message={state.error} onRetry={state.refetch} /> :
      rows.length === 0 ?
      <Card>
          <EmptyState
          icon={<AwardIcon className="h-5 w-5" />}
          title="No placements to evaluate"
          description="A final evaluation can be recorded once a placement is active or completed." />
        
        </Card> :

      <div className="space-y-4">
          {rows.map((p) =>
        <Card key={p.id}>
              <CardHeader
            title={p.student.fullName}
            description={`${p.opportunity.title} · ${p.company.name} · ${dateRange(p.startDate, p.endDate)}`}
            action={
            p.evaluation ?
            <Badge tone="approved">
                      {p.evaluation.finalScore.toFixed(1)} / 5 · {label(p.evaluation.recommendation)}
                    </Badge> :

            <Button
              size="sm"
              onClick={() => {
                setScores(EMPTY_SCORES);
                setText({
                  strengths: '',
                  weaknesses: '',
                  recommendations: '',
                  overallComments: ''
                });
                setTarget(p);
              }}>
              
                      Record evaluation
                    </Button>

            } />
          
              <CardBody>
                {p.evaluation ?
            <>
                    <p className="mb-4 text-[12px] text-slate-500">
                      Submitted {formatDate(p.evaluation.submittedAt)} · locked
                    </p>
                    {CRITERIA.map((c) =>
              <RatingDisplay key={c.key} label={c.label} value={p.evaluation!.scores[c.key]} />
              )}
                    <DescriptionList
                className="mt-5"
                columns={1}
                items={[
                { label: 'Strengths', value: p.evaluation.strengths },
                { label: 'Areas to develop', value: p.evaluation.weaknesses },
                { label: 'Overall comments', value: p.evaluation.overallComments }]
                } />
              
                  </> :

            <div className="flex items-center gap-3">
                    <Avatar name={p.student.fullName} size="sm" />
                    <p className="text-[13px] text-slate-600">
                      {p.supervisionCount} supervision report
                      {p.supervisionCount === 1 ? '' : 's'} recorded ·{' '}
                      {p.progressReportCount} progress report
                      {p.progressReportCount === 1 ? '' : 's'} from the student.
                    </p>
                  </div>
            }
              </CardBody>
            </Card>
        )}
        </div>
      }

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Final evaluation"
        description={target ? `${target.student.fullName} · ${target.company.name}` : undefined}
        size="lg"
        footer={
        <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={save.submitting}>
              Cancel
            </Button>
            <Button loading={save.submitting} onClick={() => save.run()}>
              Submit and lock
            </Button>
          </>
        }>
        
        <div className="space-y-5">
          <FormError message={save.error ?? save.fieldErrors.scores} />

          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[12px] text-slate-500">Provisional overall score</p>
            <p className="text-2xl font-semibold tabular-nums text-navy-900">
              {preview.toFixed(1)}{' '}
              <span className="text-[13px] font-normal text-slate-500">
                / 5 · {label(recommendationForScore(preview))}
              </span>
            </p>
          </div>

          <div className="space-y-1">
            {CRITERIA.map((c) =>
            <RatingInput
              key={c.key}
              name={c.key}
              label={c.label}
              value={scores[c.key]}
              onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />

            )}
          </div>

          <Field label="Strengths" htmlFor="strengths" required error={save.fieldErrors.strengths}>
            <Textarea
              id="strengths"
              rows={3}
              value={text.strengths}
              onChange={(e) => setText({ ...text, strengths: e.target.value })} />
            
          </Field>
          <Field label="Areas to develop" htmlFor="weaknesses">
            <Textarea
              id="weaknesses"
              rows={3}
              value={text.weaknesses}
              onChange={(e) => setText({ ...text, weaknesses: e.target.value })} />
            
          </Field>
          <Field label="Recommendations" htmlFor="recommendations">
            <Textarea
              id="recommendations"
              rows={3}
              value={text.recommendations}
              onChange={(e) => setText({ ...text, recommendations: e.target.value })} />
            
          </Field>
          <Field
            label="Overall comments"
            htmlFor="overallComments"
            required
            error={save.fieldErrors.overallComments}>
            
            <Textarea
              id="overallComments"
              rows={4}
              value={text.overallComments}
              onChange={(e) => setText({ ...text, overallComments: e.target.value })} />
            
          </Field>

          <p className="text-[12px] leading-relaxed text-slate-500">
            Submitting locks this evaluation. Only the attachment office can reopen it for editing.
          </p>
        </div>
      </Modal>
    </>);

}