import { useMemo } from 'react';
import { buildLifecycleTimeline, profileCompletion } from '../domain/rules';
import type { TimelineStep } from '../domain/rules';
import type { ApplicationView, PlacementView } from '../types/views';
import type { DocumentRecord, StudentProfile } from '../types/models';
import { useAsync } from './useAsync';
import { getMyStudentProfile } from '../services/directoryService';
import { listDocuments } from '../services/documentService';
import { listApplications } from '../services/applicationService';
import { getMyPlacement } from '../services/placementService';
import { listSupervisionReports } from '../services/supervisionService';

export interface StudentOverview {
  profile: StudentProfile;
  documents: DocumentRecord[];
  applications: ApplicationView[];
  placement: PlacementView | null;
  /** The application the current placement came from, or the most recent live one. */
  leadApplication: ApplicationView | null;
  timeline: TimelineStep[];
  completion: ReturnType<typeof profileCompletion>;
  supervisionCount: number;
}

/**
 * Everything the student's own screens need, resolved once. The lifecycle timeline is
 * derived here rather than stored so it can never disagree with the underlying records.
 */
export function useStudentOverview() {
  const profile = useAsync(() => getMyStudentProfile(), []);
  const documents = useAsync(() => listDocuments(), []);
  const applications = useAsync(() => listApplications({ pageSize: 50 }), []);
  const placement = useAsync(() => getMyPlacement(), []);
  const supervision = useAsync(
    () => listSupervisionReports({ submitted: true, pageSize: 50 }),
    []
  );

  const loading =
  profile.loading || documents.loading || applications.loading || placement.loading;
  const error =
  profile.error ?? documents.error ?? applications.error ?? placement.error ?? null;

  const data = useMemo<StudentOverview | null>(() => {
    if (!profile.data || !documents.data || !applications.data) return null;
    const apps = applications.data.results;
    const current = placement.data ?? null;
    const lead =
    (current ? apps.find((a) => a.id === current.applicationId) : undefined) ??
    apps.find((a) => a.status !== 'WITHDRAWN') ??
    apps[0] ??
    null;

    const supervisionCount = supervision.data?.results.length ?? 0;

    return {
      profile: profile.data,
      documents: documents.data,
      applications: apps,
      placement: current,
      leadApplication: lead,
      timeline: buildLifecycleTimeline(
        lead,
        current,
        supervisionCount > 0,
        !!current?.evaluation?.locked
      ),
      completion: profileCompletion(profile.data, documents.data),
      supervisionCount
    };
  }, [profile.data, documents.data, applications.data, placement.data, supervision.data]);

  const refetch = () => {
    profile.refetch();
    documents.refetch();
    applications.refetch();
    placement.refetch();
    supervision.refetch();
  };

  return { data, loading, error, refetch };
}