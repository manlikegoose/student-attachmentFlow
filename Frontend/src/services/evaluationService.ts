/**
 * Final evaluation service.
 *
 * Endpoint map (future DRF):
 *   GET   /api/evaluations/            → listEvaluations (role-scoped)
 *   GET   /api/evaluations/:id/        → getEvaluation
 *   POST  /api/evaluations/            → submitEvaluation  (SUPERVISOR or host COMPANY)
 *   POST  /api/evaluations/:id/reopen/ → reopenEvaluation  (COORDINATOR)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { Evaluation, EvaluationScores } from '../types/models';
import { canEditEvaluation, canViewPlacement, computeFinalScore, recommendationForScore } from '../domain/rules';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { paginate, request } from './transport';
import { requireActor, requireRole } from './session';

export interface EvaluationQuery extends PageQuery {
  placementId?: string;
  studentId?: string;
  evaluatorId?: string;
}

export function listEvaluations(query: EvaluationQuery = {}): Promise<Paginated<Evaluation>> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = db.evaluations.
      filter((e) => {
        const placement = db.placements.find((p) => p.id === e.placementId);
        if (!placement || !canViewPlacement(actor, placement)) return false;
        return (
          (!query.placementId || e.placementId === query.placementId) && (
          !query.studentId || e.studentId === query.studentId) && (
          !query.evaluatorId || e.evaluatorId === query.evaluatorId));

      }).
      sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
      return paginate(rows, query);
    });
  });
}

export function getEvaluationForPlacement(placementId: string): Promise<Evaluation | null> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const placement = db.placements.find((p) => p.id === placementId);
      if (!placement) throw notFound('Placement not found.');
      if (!canViewPlacement(actor, placement)) throw forbidden();
      return db.evaluations.find((e) => e.placementId === placementId) ?? null;
    });
  });
}

export interface EvaluationInput {
  placementId: string;
  scores: EvaluationScores;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  overallComments: string;
}

export function submitEvaluation(input: EvaluationInput): Promise<Evaluation> {
  return request(() => {
    const actor = requireRole('SUPERVISOR', 'COMPANY');
    return write((db) => {
      const placement = db.placements.find((p) => p.id === input.placementId);
      if (!placement) throw notFound('Placement not found.');
      if (actor.role === 'SUPERVISOR' && placement.academicSupervisorId !== actor.profileId) {
        throw forbidden('This student is not assigned to you.');
      }
      if (actor.role === 'COMPANY' && placement.companyId !== actor.profileId) {
        throw forbidden();
      }
      if (!['ACTIVE', 'COMPLETED'].includes(placement.status)) {
        throw badRequest({
          detail: 'A final evaluation can only be recorded on an active or completed placement.'
        });
      }

      const existing = db.evaluations.find((e) => e.placementId === placement.id);
      if (existing) {
        const gate = canEditEvaluation(existing, actor);
        if (!gate.allowed) throw forbidden(gate.reason);
      }

      const errors: Record<string, string[]> = {};
      const values = Object.values(input.scores);
      if (values.length !== 8 || values.some((v) => v < 1 || v > 5)) {
        errors.scores = ['Score every area from 1 to 5.'];
      }
      if (input.strengths.trim().length < 20) errors.strengths = ['Describe the student’s strengths.'];
      if (input.overallComments.trim().length < 20)
      errors.overallComments = ['Provide overall comments of at least 20 characters.'];
      if (Object.keys(errors).length) throw badRequest(errors);

      const finalScore = computeFinalScore(input.scores);
      const record: Evaluation = {
        id: existing?.id ?? nextId('ev'),
        placementId: placement.id,
        studentId: placement.studentId,
        evaluatorId: actor.profileId,
        evaluatorRole: actor.role === 'COMPANY' ? 'COMPANY' : 'SUPERVISOR',
        scores: input.scores,
        strengths: input.strengths.trim(),
        weaknesses: input.weaknesses.trim(),
        recommendations: input.recommendations.trim(),
        overallComments: input.overallComments.trim(),
        finalScore,
        recommendation: recommendationForScore(finalScore),
        locked: true,
        submittedAt: nowISO(),
        createdAt: existing?.createdAt ?? nowISO()
      };
      if (existing) {
        Object.assign(existing, record);
      } else {
        db.evaluations.push(record);
      }

      const student = db.students.find((s) => s.id === placement.studentId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'EVALUATION',
          title: 'Final evaluation completed',
          message: `Your final evaluation has been submitted. Overall score ${finalScore.toFixed(1)} / 5.`,
          link: '/student/placement'
        });
      }
      db.coordinators.forEach((c) =>
      pushNotification(db, {
        userId: c.userId,
        type: 'EVALUATION',
        title: 'Evaluation submitted',
        message: `${actor.fullName} submitted the final evaluation for ${student?.fullName ?? 'a student'}.`,
        link: `/coordinator/placements/${placement.id}`
      })
      );
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'EVALUATION_SUBMITTED',
        objectType: 'Evaluation',
        objectId: record.id,
        objectLabel: `${student?.fullName ?? 'Student'} — final evaluation`,
        metadata: { finalScore }
      });
      return record;
    });
  });
}

export function reopenEvaluation(id: string, reason: string): Promise<Evaluation> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const record = db.evaluations.find((e) => e.id === id);
      if (!record) throw notFound('Evaluation not found.');
      if (!record.locked) throw badRequest({ detail: 'This evaluation is already open.' });
      if (!reason.trim()) throw badRequest({ reason: ['A reason is required.'] });
      record.locked = false;
      const evaluator = db.supervisors.find((s) => s.id === record.evaluatorId);
      if (evaluator) {
        pushNotification(db, {
          userId: evaluator.userId,
          type: 'EVALUATION',
          title: 'Evaluation reopened',
          message: `The attachment office reopened an evaluation for editing: ${reason}`,
          link: '/supervisor/evaluations'
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'EVALUATION_REOPENED',
        objectType: 'Evaluation',
        objectId: record.id,
        objectLabel: `Evaluation reopened — ${reason}`,
        metadata: { reason }
      });
      return record;
    });
  });
}