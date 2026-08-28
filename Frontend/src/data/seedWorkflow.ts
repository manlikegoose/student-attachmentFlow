import type {
  Application,
  AuditLogEntry,
  DocumentRecord,
  Evaluation,
  Notification,
  Placement,
  ProgressReport,
  SupervisionReport } from
'../types/models';

/* ------------------------------------------------------------------ *
 * Documents
 * Victor's required set is fully approved so the live demo can reach
 * university approval. Amina's insurance is still pending, which lets the
 * coordinator demonstrate the "required documents" rule blocking approval.
 * ------------------------------------------------------------------ */

const doc = (
id: string,
ownerId: string,
type: DocumentRecord['type'],
filename: string,
status: DocumentRecord['status'],
uploadedAt: string,
extra: Partial<DocumentRecord> = {})
: DocumentRecord => ({
  id,
  ownerId,
  ownerRole: 'STUDENT',
  type,
  filename,
  mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
  sizeBytes: 180_000 + filename.length * 1_337,
  uploadedAt,
  status,
  previewUrl: null,
  ...extra
});

export const documents: DocumentRecord[] = [
// Victor Kiplangat — demo student, required set approved
doc('doc-1', 'std-1', 'CV', 'Victor_Kiplangat_CV.pdf', 'APPROVED', '2026-08-06', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-08',
  reviewComment: 'Well structured. Approved.'
}),
doc('doc-2', 'std-1', 'INTRODUCTION_LETTER', 'KARU_Introduction_Letter_ADM_IT_1042.pdf', 'APPROVED', '2026-08-06', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-08'
}),
doc('doc-3', 'std-1', 'INSURANCE', 'Student_Insurance_Cover_2026.pdf', 'APPROVED', '2026-08-07', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-08'
}),
doc('doc-4', 'std-1', 'ACADEMIC_TRANSCRIPT', 'Transcript_Y2S2.pdf', 'PENDING', '2026-08-20'),

// Amina Hassan — insurance pending, blocks university approval
doc('doc-5', 'std-2', 'CV', 'Amina_Hassan_CV.pdf', 'APPROVED', '2026-07-22', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-07-24'
}),
doc('doc-6', 'std-2', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_CS_0918.pdf', 'APPROVED', '2026-07-22', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-07-24'
}),
doc('doc-7', 'std-2', 'INSURANCE', 'Insurance_Cover_Draft.pdf', 'PENDING', '2026-08-25'),

// Brian Otieno — active placement
doc('doc-8', 'std-3', 'CV', 'Brian_Otieno_CV.pdf', 'APPROVED', '2026-04-18', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-21'
}),
doc('doc-9', 'std-3', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_IT_0771.pdf', 'APPROVED', '2026-04-18', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-21'
}),
doc('doc-10', 'std-3', 'INSURANCE', 'Insurance_Cover_Otieno.pdf', 'APPROVED', '2026-04-19', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-21'
}),
doc('doc-11', 'std-3', 'ACCEPTANCE_LETTER', 'RVS_Acceptance_Letter.pdf', 'APPROVED', '2026-05-20', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-05-22'
}),

// Cynthia Wairimu — completed
doc('doc-12', 'std-4', 'CV', 'Cynthia_Wairimu_CV.pdf', 'APPROVED', '2026-03-30', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-01'
}),
doc('doc-13', 'std-4', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_CS_0654.pdf', 'APPROVED', '2026-03-30', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-01'
}),
doc('doc-14', 'std-4', 'INSURANCE', 'Insurance_Cover_Wairimu.pdf', 'APPROVED', '2026-03-31', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-04-01'
}),

// Dennis Kimani
doc('doc-15', 'std-5', 'CV', 'Dennis_Kimani_CV.pdf', 'APPROVED', '2026-07-11', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-07-14'
}),
doc('doc-16', 'std-5', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_IT_1150.pdf', 'REJECTED', '2026-07-11', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-07-14',
  reviewComment: 'Letter is unsigned and does not carry the departmental stamp. Please resubmit.'
}),

// Faith Njeri
doc('doc-17', 'std-6', 'CV', 'Faith_Njeri_CV.pdf', 'PENDING', '2026-08-22'),
doc('doc-18', 'std-6', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_CS_1203.pdf', 'PENDING', '2026-08-22'),

// Geoffrey Mutiso
doc('doc-19', 'std-7', 'CV', 'Geoffrey_Mutiso_CV.pdf', 'APPROVED', '2026-04-28', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-05-02'
}),
doc('doc-20', 'std-7', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_IT_0812.pdf', 'APPROVED', '2026-04-28', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-05-02'
}),
doc('doc-21', 'std-7', 'INSURANCE', 'Insurance_Cover_Mutiso.pdf', 'APPROVED', '2026-04-29', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-05-02'
}),

// Halima Yusuf
doc('doc-22', 'std-8', 'CV', 'Halima_Yusuf_CV.pdf', 'APPROVED', '2026-07-30', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-01'
}),
doc('doc-23', 'std-8', 'INTRODUCTION_LETTER', 'Introduction_Letter_ADM_CS_0990.pdf', 'APPROVED', '2026-07-30', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-01'
}),
doc('doc-24', 'std-8', 'INSURANCE', 'Insurance_Cover_Yusuf.pdf', 'APPROVED', '2026-07-31', {
  reviewedById: 'coord-1',
  reviewedAt: '2026-08-01'
})];


/* ------------------------------------------------------------------ *
 * Applications — every state represented
 * ------------------------------------------------------------------ */

export const applications: Application[] = [
{
  id: 'app-1',
  studentId: 'std-2',
  opportunityId: 'opp-2',
  companyId: 'co-1',
  status: 'UNIVERSITY_REVIEW',
  coverLetter:
  'I am applying for the Cybersecurity Operations attachment. My coursework in network security and my work on the campus CTF team have prepared me to support alert triage and incident documentation.',
  documentIds: ['doc-5', 'doc-6', 'doc-7'],
  submittedAt: '2026-08-12',
  updatedAt: '2026-08-21',
  companyDecisionById: 'co-1',
  companyDecisionAt: '2026-08-21',
  companyDecisionReason: 'Strong security fundamentals and clear written communication.'
},
{
  id: 'app-2',
  studentId: 'std-3',
  opportunityId: 'opp-10',
  companyId: 'co-2',
  status: 'UNIVERSITY_APPROVED',
  coverLetter:
  'I would like to join the network operations team for the June cycle. I hold CCNA-level coursework and have supported the campus network as a student technician.',
  documentIds: ['doc-8', 'doc-9', 'doc-10'],
  submittedAt: '2026-04-22',
  updatedAt: '2026-05-18',
  companyDecisionById: 'co-2',
  companyDecisionAt: '2026-05-08',
  universityDecisionById: 'coord-1',
  universityDecisionAt: '2026-05-18'
},
{
  id: 'app-3',
  studentId: 'std-4',
  opportunityId: 'opp-8',
  companyId: 'co-3',
  status: 'UNIVERSITY_APPROVED',
  coverLetter:
  'I am applying for the BI reporting attachment. I have completed statistics and database coursework and built a cooperative dashboard as a class project.',
  documentIds: ['doc-12', 'doc-13', 'doc-14'],
  submittedAt: '2026-04-04',
  updatedAt: '2026-04-28',
  companyDecisionById: 'co-3',
  companyDecisionAt: '2026-04-18',
  universityDecisionById: 'coord-1',
  universityDecisionAt: '2026-04-28'
},
{
  id: 'app-4',
  studentId: 'std-5',
  opportunityId: 'opp-1',
  companyId: 'co-1',
  status: 'COMPANY_REJECTED',
  coverLetter:
  'I am interested in the software engineering attachment and would like to develop my backend skills.',
  documentIds: ['doc-15'],
  submittedAt: '2026-08-09',
  updatedAt: '2026-08-18',
  companyDecisionById: 'co-1',
  companyDecisionAt: '2026-08-18',
  companyDecisionReason:
  'Limited exposure to server-side development at this stage. We encourage a reapplication next cycle.'
},
{
  id: 'app-5',
  studentId: 'std-6',
  opportunityId: 'opp-1',
  companyId: 'co-1',
  status: 'SUBMITTED',
  coverLetter:
  'I would like to be considered for the software engineering attachment. I lead the campus innovation club web team and have shipped three React applications for student services.',
  documentIds: ['doc-17', 'doc-18'],
  submittedAt: '2026-08-24',
  updatedAt: '2026-08-24'
},
{
  id: 'app-6',
  studentId: 'std-7',
  opportunityId: 'opp-11',
  companyId: 'co-3',
  status: 'UNIVERSITY_APPROVED',
  coverLetter:
  'I am applying for the data engineering attachment. I have built ETL scripts in Python and am comfortable with SQL.',
  documentIds: ['doc-19', 'doc-20', 'doc-21'],
  submittedAt: '2026-04-30',
  updatedAt: '2026-05-26',
  companyDecisionById: 'co-3',
  companyDecisionAt: '2026-05-14',
  universityDecisionById: 'coord-1',
  universityDecisionAt: '2026-05-26'
},
{
  id: 'app-7',
  studentId: 'std-8',
  opportunityId: 'opp-5',
  companyId: 'co-5',
  status: 'UNIVERSITY_APPROVED',
  coverLetter:
  'I would like to join the field operations team. I have networking coursework and an interest in last-mile connectivity in rural Nyeri.',
  documentIds: ['doc-22', 'doc-23', 'doc-24'],
  submittedAt: '2026-07-31',
  updatedAt: '2026-08-19',
  companyDecisionById: 'co-5',
  companyDecisionAt: '2026-08-11',
  universityDecisionById: 'coord-1',
  universityDecisionAt: '2026-08-19'
},
{
  id: 'app-8',
  studentId: 'std-5',
  opportunityId: 'opp-3',
  companyId: 'co-2',
  status: 'UNDER_COMPANY_REVIEW',
  coverLetter:
  'Following my interest in infrastructure, I would like to be considered for the network attachment in Nakuru.',
  documentIds: ['doc-15'],
  submittedAt: '2026-08-20',
  updatedAt: '2026-08-23'
},
{
  id: 'app-9',
  studentId: 'std-6',
  opportunityId: 'opp-4',
  companyId: 'co-3',
  status: 'WITHDRAWN',
  coverLetter: 'Application for the data analytics attachment in Eldoret.',
  documentIds: ['doc-17'],
  submittedAt: '2026-08-15',
  updatedAt: '2026-08-23'
}];


/* ------------------------------------------------------------------ *
 * Placements — separate entities, created after university approval
 * ------------------------------------------------------------------ */

export const placements: Placement[] = [
{
  id: 'pl-1',
  applicationId: 'app-2',
  studentId: 'std-3',
  companyId: 'co-2',
  opportunityId: 'opp-10',
  startDate: '2026-06-01',
  endDate: '2026-09-04',
  workplaceSupervisorId: 'wsup-3',
  academicSupervisorId: 'sup-1',
  status: 'ACTIVE',
  approvedAt: '2026-05-18',
  approvedById: 'coord-1',
  supervisorAssignedAt: '2026-05-21',
  createdAt: '2026-05-18'
},
{
  id: 'pl-2',
  applicationId: 'app-3',
  studentId: 'std-4',
  companyId: 'co-3',
  opportunityId: 'opp-8',
  startDate: '2026-05-11',
  endDate: '2026-08-07',
  workplaceSupervisorId: 'wsup-4',
  academicSupervisorId: 'sup-1',
  status: 'COMPLETED',
  approvedAt: '2026-04-28',
  approvedById: 'coord-1',
  supervisorAssignedAt: '2026-05-02',
  completedAt: '2026-08-14',
  createdAt: '2026-04-28'
},
{
  id: 'pl-3',
  applicationId: 'app-6',
  studentId: 'std-7',
  companyId: 'co-3',
  opportunityId: 'opp-11',
  startDate: '2026-06-08',
  endDate: '2026-09-11',
  workplaceSupervisorId: 'wsup-4',
  academicSupervisorId: 'sup-2',
  status: 'ACTIVE',
  approvedAt: '2026-05-26',
  approvedById: 'coord-1',
  supervisorAssignedAt: '2026-05-29',
  createdAt: '2026-05-26'
},
{
  id: 'pl-4',
  applicationId: 'app-7',
  studentId: 'std-8',
  companyId: 'co-5',
  opportunityId: 'opp-5',
  startDate: '2026-09-01',
  endDate: '2026-11-21',
  workplaceSupervisorId: 'wsup-5',
  academicSupervisorId: 'sup-2',
  status: 'UPCOMING',
  approvedAt: '2026-08-19',
  approvedById: 'coord-1',
  supervisorAssignedAt: '2026-08-20',
  createdAt: '2026-08-19'
}];


/* ------------------------------------------------------------------ *
 * Supervision — submitted and draft, one placement deliberately overdue
 * ------------------------------------------------------------------ */

export const supervisionReports: SupervisionReport[] = [
{
  id: 'sr-1',
  placementId: 'pl-1',
  studentId: 'std-3',
  supervisorId: 'sup-1',
  date: '2026-06-26',
  type: 'PHYSICAL_VISIT',
  studentPresent: true,
  progressSummary:
  'Visited Rift Valley Systems in Nakuru. Brian has been rotated through the service desk and is now shadowing the field team on switch installations.',
  technicalProgress:
  'Comfortable configuring VLANs on Cisco switches and has begun documenting cabling schedules independently.',
  challenges:
  'Site travel schedule occasionally conflicts with the weekly logbook submission deadline.',
  strengths: 'Methodical, asks good diagnostic questions, well regarded by the host team.',
  areasForImprovement:
  'Should record fault resolutions in more detail; current notes are too brief for handover.',
  recommendations:
  'Agree a fixed logbook slot each Friday with the workplace supervisor.',
  supervisorComments: 'Good start to the attachment. Host organisation is engaged and supportive.',
  submitted: true,
  submittedAt: '2026-06-27',
  createdAt: '2026-06-26'
},
{
  id: 'sr-2',
  placementId: 'pl-1',
  studentId: 'std-3',
  supervisorId: 'sup-1',
  date: '2026-08-04',
  type: 'VIRTUAL_MEETING',
  studentPresent: true,
  progressSummary:
  'Follow-up meeting over video. Brian is now leading small installations under supervision and has taken on documentation for two hospital sites.',
  technicalProgress:
  'Confident with switch and router configuration; has started basic firewall rule reviews.',
  challenges: 'Wants more exposure to network monitoring tooling before the attachment ends.',
  strengths: 'Improved documentation discipline since the June visit.',
  areasForImprovement: 'Broaden exposure to monitoring and alerting.',
  recommendations:
  'Requested the workplace supervisor schedule two sessions on the NMS platform before September.',
  supervisorComments: 'On track. No concerns raised by the host organisation.',
  submitted: true,
  submittedAt: '2026-08-04',
  createdAt: '2026-08-04'
},
{
  id: 'sr-3',
  placementId: 'pl-2',
  studentId: 'std-4',
  supervisorId: 'sup-1',
  date: '2026-06-12',
  type: 'PHYSICAL_VISIT',
  studentPresent: true,
  progressSummary:
  'Visited Eldoret Data Works. Cynthia has been assigned to the SACCO reporting workstream.',
  technicalProgress: 'Building scheduled Power BI reports and writing intermediate SQL.',
  challenges: 'Data quality issues in client extracts slow her weekly deliverables.',
  strengths: 'Clear communicator; presents findings confidently to the analytics lead.',
  areasForImprovement: 'Version control discipline for report definitions.',
  recommendations: 'Introduce her to the team Git workflow.',
  supervisorComments: 'Strong placement fit.',
  submitted: true,
  submittedAt: '2026-06-12',
  createdAt: '2026-06-12'
},
{
  id: 'sr-4',
  placementId: 'pl-2',
  studentId: 'std-4',
  supervisorId: 'sup-1',
  date: '2026-07-24',
  type: 'PHYSICAL_VISIT',
  studentPresent: true,
  progressSummary:
  'Final supervision visit. Cynthia has delivered the cooperative performance dashboard now in use by three clients.',
  technicalProgress: 'Independent across the full reporting pipeline.',
  challenges: 'None outstanding.',
  strengths: 'Ownership, initiative, client-facing confidence.',
  areasForImprovement: 'Could deepen statistical modelling knowledge.',
  recommendations: 'Recommend final evaluation proceed at the end of the placement.',
  supervisorComments: 'Exemplary attachment.',
  submitted: true,
  submittedAt: '2026-07-25',
  createdAt: '2026-07-24'
},
{
  id: 'sr-5',
  placementId: 'pl-3',
  studentId: 'std-7',
  supervisorId: 'sup-2',
  date: '2026-07-05',
  type: 'PHONE_CALL',
  studentPresent: true,
  progressSummary:
  'Phone check-in with Geoffrey and the workplace supervisor. Working on ETL scripts for cooperative data loads.',
  technicalProgress: 'Writing Python extract jobs; still dependent on review for SQL tuning.',
  challenges: 'Intermittent access to the staging database.',
  strengths: 'Persistent and self-directed.',
  areasForImprovement: 'Needs to raise blockers earlier.',
  recommendations: 'Physical visit to be scheduled for August.',
  supervisorComments: 'Follow up required — visit has not yet taken place.',
  submitted: true,
  submittedAt: '2026-07-06',
  createdAt: '2026-07-05'
},
{
  id: 'sr-6',
  placementId: 'pl-3',
  studentId: 'std-7',
  supervisorId: 'sup-2',
  date: '2026-08-20',
  type: 'PHYSICAL_VISIT',
  studentPresent: true,
  progressSummary: 'Draft notes from the Eldoret site visit — not yet finalised.',
  technicalProgress: '',
  challenges: '',
  strengths: '',
  areasForImprovement: '',
  recommendations: '',
  supervisorComments: '',
  submitted: false,
  createdAt: '2026-08-20'
}];


export const progressReports: ProgressReport[] = [
{
  id: 'pr-1',
  placementId: 'pl-1',
  studentId: 'std-3',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  activitiesCompleted:
  'Inducted into the network operations team, shadowed three client installations in Nakuru town, and took over service-desk ticket triage on Tuesdays and Thursdays.',
  skillsLearned:
  'VLAN configuration on Cisco switches, structured cabling standards, ticket triage discipline.',
  challenges: 'Balancing site travel with the weekly logbook.',
  achievements: 'Resolved 14 tier-one tickets independently by the end of the month.',
  nextGoals: 'Take part in a full switch replacement and begin documenting cabling schedules.',
  submittedAt: '2026-07-02',
  reviewedById: 'sup-1',
  reviewedAt: '2026-07-04',
  supervisorFeedback:
  'Good first month. Keep the ticket log detailed enough for someone else to pick up.'
},
{
  id: 'pr-2',
  placementId: 'pl-1',
  studentId: 'std-3',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  activitiesCompleted:
  'Led two small installations under supervision, produced cabling documentation for the Nakuru County Referral Hospital site, assisted with a switch firmware upgrade window.',
  skillsLearned: 'Change-window procedure, firmware upgrade rollback planning.',
  challenges: 'Limited exposure so far to network monitoring tooling.',
  achievements: 'Documentation adopted as the team template for future site records.',
  nextGoals: 'Hands-on time with the monitoring platform before the attachment ends.',
  submittedAt: '2026-08-03'
},
{
  id: 'pr-3',
  placementId: 'pl-3',
  studentId: 'std-7',
  periodStart: '2026-06-08',
  periodEnd: '2026-07-08',
  activitiesCompleted:
  'Built Python extract jobs for two cooperative clients and assisted with data quality checks on the staging warehouse.',
  skillsLearned: 'Incremental loads, scheduling with cron, SQL window functions.',
  challenges: 'Staging database access was intermittent for two weeks.',
  achievements: 'Cut the nightly load runtime by roughly a third.',
  nextGoals: 'Own an end-to-end pipeline for one client.',
  submittedAt: '2026-07-11',
  reviewedById: 'sup-2',
  reviewedAt: '2026-07-15',
  supervisorFeedback: 'Solid progress. Raise access blockers with your workplace supervisor sooner.'
},
{
  id: 'pr-4',
  placementId: 'pl-2',
  studentId: 'std-4',
  periodStart: '2026-07-01',
  periodEnd: '2026-08-07',
  activitiesCompleted:
  'Delivered the cooperative performance dashboard, handed over documentation and trained two client users.',
  skillsLearned: 'Requirements gathering, dashboard performance tuning, user training.',
  challenges: 'Client data definitions changed mid-cycle and required rework.',
  achievements: 'Dashboard adopted by three cooperative clients.',
  nextGoals: 'Complete handover notes and close out the attachment.',
  submittedAt: '2026-08-08',
  reviewedById: 'sup-1',
  reviewedAt: '2026-08-10',
  supervisorFeedback: 'Excellent close-out. Reflected in the final evaluation.'
}];


export const evaluations: Evaluation[] = [
{
  id: 'ev-1',
  placementId: 'pl-2',
  studentId: 'std-4',
  evaluatorId: 'sup-1',
  evaluatorRole: 'SUPERVISOR',
  scores: {
    technicalSkills: 4,
    communication: 5,
    teamwork: 5,
    professionalism: 5,
    punctuality: 4,
    problemSolving: 4,
    adaptability: 4,
    overallPerformance: 5
  },
  strengths:
  'Exceptional client communication, strong ownership of deliverables, and a dashboard now in production use at three cooperatives.',
  weaknesses:
  'Statistical modelling depth is still developing relative to her reporting and visualisation strength.',
  recommendations:
  'Encourage further coursework in applied statistics and consider her for a graduate analyst pathway.',
  overallComments:
  'One of the strongest attachments supervised this cycle. The host organisation has offered a graduate interview.',
  finalScore: 4.5,
  recommendation: 'HIGHLY_RECOMMENDED',
  locked: true,
  submittedAt: '2026-08-14',
  createdAt: '2026-08-12'
}];


/* ------------------------------------------------------------------ *
 * Notifications — read and unread, per role
 * ------------------------------------------------------------------ */

const n = (
id: string,
userId: string,
type: Notification['type'],
title: string,
message: string,
createdAt: string,
read: boolean,
link?: string)
: Notification => ({ id, userId, type, title, message, createdAt, read, link: link ?? null });

export const notifications: Notification[] = [
n('nt-1', 'u-std-1', 'DOCUMENT', 'Documents approved', 'Your CV, introduction letter and insurance cover have been approved by the attachment office.', '2026-08-08T10:12:00', false, '/student/documents'),
n('nt-2', 'u-std-1', 'SYSTEM', 'Applications now open', 'The September 2026 attachment cycle is open. Applications close on 4 September.', '2026-08-03T08:00:00', false, '/student/opportunities'),
n('nt-3', 'u-std-1', 'DOCUMENT', 'Transcript received', 'Your academic transcript is queued for review by the attachment office.', '2026-08-20T14:40:00', true, '/student/documents'),

n('nt-4', 'u-std-2', 'APPLICATION', 'Application accepted by DumuTech Ltd.', 'DumuTech Ltd. accepted your application for the Cybersecurity Operations Attachment. It is now awaiting university review.', '2026-08-21T09:30:00', false, '/student/applications/app-1'),
n('nt-5', 'u-std-2', 'DOCUMENT', 'Insurance cover pending review', 'Your insurance document is pending review. University approval cannot proceed until it is approved.', '2026-08-25T11:05:00', false, '/student/documents'),

n('nt-6', 'u-std-3', 'SUPERVISION', 'Supervision report submitted', 'Dr. Jane Wanjiku submitted a supervision report for your placement at Rift Valley Systems.', '2026-08-04T16:20:00', false, '/student/placement'),
n('nt-7', 'u-std-3', 'PLACEMENT', 'Attachment in progress', 'Your placement at Rift Valley Systems is active until 4 September 2026.', '2026-06-01T07:00:00', true, '/student/placement'),

n('nt-8', 'u-std-4', 'EVALUATION', 'Final evaluation completed', 'Your final evaluation has been submitted. Overall score: 4.5 / 5 — Highly recommended.', '2026-08-14T15:00:00', false, '/student/placement'),
n('nt-9', 'u-std-4', 'PLACEMENT', 'Placement completed', 'Your attachment at Eldoret Data Works has been marked completed.', '2026-08-14T15:05:00', true, '/student/placement'),

n('nt-10', 'u-std-5', 'APPLICATION', 'Application not successful', 'DumuTech Ltd. did not proceed with your application for the Software Engineering Attachment.', '2026-08-18T13:10:00', false, '/student/applications/app-4'),
n('nt-11', 'u-std-5', 'DOCUMENT', 'Document rejected', 'Your introduction letter was rejected: unsigned and missing the departmental stamp.', '2026-07-14T09:00:00', true, '/student/documents'),

n('nt-12', 'u-std-6', 'APPLICATION', 'Application submitted', 'Your application to DumuTech Ltd. for the Software Engineering Attachment has been submitted.', '2026-08-24T12:00:00', false, '/student/applications/app-5'),

n('nt-13', 'u-std-7', 'SUPERVISION', 'Supervision due', 'No supervision has been recorded for your placement since 5 July. Your supervisor has been notified.', '2026-08-20T08:00:00', false, '/student/placement'),
n('nt-14', 'u-std-8', 'PLACEMENT', 'Placement starts soon', 'Your placement at Tech Networks begins on 1 September 2026.', '2026-08-20T09:00:00', false, '/student/placement'),

n('nt-15', 'u-co-1', 'APPLICATION', 'New application received', 'Faith Njeri applied for the Software Engineering Attachment.', '2026-08-24T12:00:00', false, '/company/applications/app-5'),
n('nt-16', 'u-co-1', 'COMPANY', 'Opportunity awaiting approval', 'Cloud & DevOps Attachment has been submitted to the university for approval.', '2026-08-24T10:30:00', false, '/company/opportunities/opp-6'),
n('nt-17', 'u-co-1', 'APPLICATION', 'Application forwarded to university', 'Your acceptance of Amina Hassan has been forwarded for university review.', '2026-08-21T09:31:00', true, '/company/applications/app-1'),

n('nt-18', 'u-co-2', 'APPLICATION', 'New application received', 'Dennis Kimani applied for the Network Infrastructure Attachment.', '2026-08-20T15:45:00', false, '/company/applications/app-8'),
n('nt-19', 'u-co-4', 'COMPANY', 'Verification pending', 'Your verification documents are with the university attachment office.', '2026-08-14T10:00:00', false, '/company/profile'),
n('nt-20', 'u-co-5', 'PLACEMENT', 'Intern starting soon', 'Halima Yusuf begins her placement on 1 September 2026.', '2026-08-20T09:05:00', true, '/company/students'),

n('nt-21', 'u-coord-1', 'APPLICATION', 'Application awaiting university review', 'Amina Hassan — Cybersecurity Operations Attachment at DumuTech Ltd.', '2026-08-21T09:30:00', false, '/coordinator/applications/app-1'),
n('nt-22', 'u-coord-1', 'COMPANY', 'Company awaiting verification', 'Nyeri Agritech Solutions submitted verification documents.', '2026-08-14T10:00:00', false, '/coordinator/companies/co-4'),
n('nt-23', 'u-coord-1', 'SUPERVISION', 'Overdue supervision', 'Geoffrey Mutiso has had no recorded supervision since 5 July 2026.', '2026-08-20T08:00:00', false, '/coordinator/placements/pl-3'),
n('nt-24', 'u-coord-1', 'COMPANY', 'Opportunity awaiting approval', 'DumuTech Ltd. submitted Cloud & DevOps Attachment for approval.', '2026-08-24T10:30:00', false, '/coordinator/opportunities'),
n('nt-25', 'u-coord-1', 'EVALUATION', 'Evaluation submitted', 'Dr. Jane Wanjiku submitted the final evaluation for Cynthia Wairimu.', '2026-08-14T15:00:00', true, '/coordinator/placements/pl-2'),

n('nt-26', 'u-sup-1', 'SUPERVISION', 'Progress report awaiting review', 'Brian Otieno submitted his July progress report.', '2026-08-03T09:00:00', false, '/supervisor/placements/pl-1'),
n('nt-27', 'u-sup-1', 'PLACEMENT', 'Placement ending soon', 'Brian Otieno\u2019s placement at Rift Valley Systems ends on 4 September 2026. A final evaluation will be required.', '2026-08-21T07:00:00', false, '/supervisor/evaluations'),
n('nt-28', 'u-sup-2', 'SUPERVISION', 'Supervision overdue', 'Geoffrey Mutiso has had no recorded supervision for more than 30 days.', '2026-08-20T08:00:00', false, '/supervisor/students/std-7'),
n('nt-29', 'u-sup-2', 'PLACEMENT', 'New placement upcoming', 'Halima Yusuf begins her placement at Tech Networks on 1 September 2026.', '2026-08-20T09:10:00', true, '/supervisor/placements/pl-4')];


/* ------------------------------------------------------------------ *
 * Audit trail
 * ------------------------------------------------------------------ */

const a = (
id: string,
actorId: string,
actorName: string,
actorRole: AuditLogEntry['actorRole'],
action: AuditLogEntry['action'],
objectType: string,
objectId: string,
objectLabel: string,
createdAt: string,
metadata?: AuditLogEntry['metadata'])
: AuditLogEntry => ({
  id,
  actorId,
  actorName,
  actorRole,
  action,
  objectType,
  objectId,
  objectLabel,
  createdAt,
  metadata
});

export const auditLog: AuditLogEntry[] = [
a('au-1', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'COMPANY_VERIFIED', 'Company', 'co-1', 'DumuTech Ltd.', '2026-02-03T11:20:00', { registry: 'PVT-K7XQ4210' }),
a('au-2', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'COMPANY_VERIFIED', 'Company', 'co-2', 'Rift Valley Systems', '2026-02-11T09:40:00'),
a('au-3', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'PLACEMENT_APPROVED', 'Placement', 'pl-2', 'Cynthia Wairimu — Eldoret Data Works', '2026-04-28T14:05:00'),
a('au-4', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'SUPERVISOR_ASSIGNED', 'Placement', 'pl-2', 'Cynthia Wairimu — Dr. Jane Wanjiku', '2026-05-02T10:15:00', { supervisor: 'Dr. Jane Wanjiku' }),
a('au-5', 'co-2', 'Rift Valley Systems', 'COMPANY', 'APPLICATION_ACCEPTED', 'Application', 'app-2', 'Brian Otieno — Network Support Attachment', '2026-05-08T15:30:00'),
a('au-6', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'PLACEMENT_APPROVED', 'Placement', 'pl-1', 'Brian Otieno — Rift Valley Systems', '2026-05-18T12:00:00'),
a('au-7', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'SUPERVISOR_ASSIGNED', 'Placement', 'pl-1', 'Brian Otieno — Dr. Jane Wanjiku', '2026-05-21T08:45:00', { supervisor: 'Dr. Jane Wanjiku' }),
a('au-8', 'sup-1', 'Dr. Jane Wanjiku', 'SUPERVISOR', 'SUPERVISION_SUBMITTED', 'SupervisionReport', 'sr-1', 'Brian Otieno — physical visit', '2026-06-27T17:10:00'),
a('au-9', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'DOCUMENT_REJECTED', 'Document', 'doc-16', 'Dennis Kimani — introduction letter', '2026-07-14T09:00:00', { reason: 'Unsigned and missing departmental stamp' }),
a('au-10', 'co-1', 'DumuTech Ltd.', 'COMPANY', 'APPLICATION_REJECTED', 'Application', 'app-4', 'Dennis Kimani — Software Engineering Attachment', '2026-08-18T13:10:00'),
a('au-11', 'co-1', 'DumuTech Ltd.', 'COMPANY', 'APPLICATION_ACCEPTED', 'Application', 'app-1', 'Amina Hassan — Cybersecurity Operations Attachment', '2026-08-21T09:30:00'),
a('au-12', 'sup-1', 'Dr. Jane Wanjiku', 'SUPERVISOR', 'EVALUATION_SUBMITTED', 'Evaluation', 'ev-1', 'Cynthia Wairimu — final evaluation', '2026-08-14T15:00:00', { finalScore: 4.5 }),
a('au-13', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'PLACEMENT_COMPLETED', 'Placement', 'pl-2', 'Cynthia Wairimu — Eldoret Data Works', '2026-08-14T15:06:00'),
a('au-14', 'coord-1', 'Mrs. Esther Muriithi', 'COORDINATOR', 'DOCUMENT_APPROVED', 'Document', 'doc-1', 'Victor Kiplangat — curriculum vitae', '2026-08-08T10:12:00'),
a('au-15', 'co-1', 'DumuTech Ltd.', 'COMPANY', 'OPPORTUNITY_PUBLISHED', 'Opportunity', 'opp-6', 'Cloud & DevOps Attachment (submitted for approval)', '2026-08-24T10:30:00')];