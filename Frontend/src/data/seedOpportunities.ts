import type { Opportunity } from '../types/models';

/**
 * Nine opportunities spanning every status so the coordinator approval queue,
 * the company authoring flow and the student search all have real content.
 */
export const opportunities: Opportunity[] = [
{
  id: 'opp-1',
  title: 'Software Engineering Attachment',
  description:
  'Join the DumuTech platform team building payment reconciliation services used by more than 400 merchants. Attachés work inside a delivery squad with a dedicated mentor, contribute to the Django codebase, and take part in code review and release planning.',
  companyId: 'co-1',
  department: 'Platform Engineering',
  industry: 'Software & IT Services',
  location: 'Westlands, Nairobi',
  town: 'Nairobi',
  workMode: 'HYBRID',
  startDate: '2026-09-14',
  endDate: '2026-12-04',
  durationWeeks: 12,
  slots: 4,
  slotsFilled: 0,
  applicationDeadline: '2026-09-04',
  requirements: [
  'Third or fourth year student in IT, Computer Science or a related programme',
  'University introduction letter and valid insurance cover',
  'Working knowledge of at least one server-side language'],

  preferredSkills: ['Python', 'Django', 'PostgreSQL', 'Git', 'REST APIs'],
  responsibilities: [
  'Implement and test API endpoints under mentor review',
  'Investigate and fix defects raised by the support desk',
  'Write technical notes for the internal engineering wiki',
  'Participate in daily stand-ups and sprint reviews'],

  status: 'PUBLISHED',
  createdAt: '2026-07-28',
  publishedAt: '2026-08-03',
  approvedById: 'coord-1'
},
{
  id: 'opp-2',
  title: 'Cybersecurity Operations Attachment',
  description:
  'Work alongside the security operations team monitoring alerts, triaging incidents and supporting quarterly vulnerability assessments across DumuTech services.',
  companyId: 'co-1',
  department: 'Security Operations',
  industry: 'Software & IT Services',
  location: 'Westlands, Nairobi',
  town: 'Nairobi',
  workMode: 'ONSITE',
  startDate: '2026-09-14',
  endDate: '2026-12-04',
  durationWeeks: 12,
  slots: 2,
  slotsFilled: 0,
  applicationDeadline: '2026-09-01',
  requirements: [
  'Coursework in network or information security',
  'University introduction letter and valid insurance cover'],

  preferredSkills: ['Cybersecurity', 'Networking', 'Incident response', 'Linux administration'],
  responsibilities: [
  'Triage security alerts under supervision',
  'Document incident timelines',
  'Assist with internal phishing awareness exercises'],

  status: 'PUBLISHED',
  createdAt: '2026-07-28',
  publishedAt: '2026-08-03',
  approvedById: 'coord-1'
},
{
  id: 'opp-3',
  title: 'Network Infrastructure Attachment',
  description:
  'Support the deployment and maintenance of campus and hospital networks across Nakuru County, including structured cabling, switch configuration and site surveys.',
  companyId: 'co-2',
  department: 'Network Operations',
  industry: 'Network & Infrastructure',
  location: 'Kenyatta Avenue, Nakuru',
  town: 'Nakuru',
  workMode: 'ONSITE',
  startDate: '2026-09-07',
  endDate: '2026-11-27',
  durationWeeks: 12,
  slots: 3,
  slotsFilled: 0,
  applicationDeadline: '2026-08-30',
  requirements: [
  'Networking coursework completed',
  'Willingness to travel to client sites within Nakuru County',
  'University introduction letter and valid insurance cover'],

  preferredSkills: ['Networking', 'Cisco IOS', 'Troubleshooting', 'Structured cabling'],
  responsibilities: [
  'Assist with switch and router configuration',
  'Carry out site surveys and produce cabling schedules',
  'Log and escalate faults through the service desk'],

  status: 'PUBLISHED',
  createdAt: '2026-07-15',
  publishedAt: '2026-07-21',
  approvedById: 'coord-1'
},
{
  id: 'opp-4',
  title: 'Data Analytics Attachment',
  description:
  'Build reporting pipelines and dashboards for SACCO and cooperative clients, working with the analytics team on data cleaning, modelling and visualisation.',
  companyId: 'co-3',
  department: 'Analytics',
  industry: 'Data & Analytics',
  location: 'Oloo Street, Eldoret',
  town: 'Eldoret',
  workMode: 'HYBRID',
  startDate: '2026-09-21',
  endDate: '2026-12-11',
  durationWeeks: 12,
  slots: 2,
  slotsFilled: 0,
  applicationDeadline: '2026-09-10',
  requirements: [
  'Statistics or database coursework',
  'University introduction letter and valid insurance cover'],

  preferredSkills: ['SQL', 'Python', 'Power BI', 'Data science', 'Statistics'],
  responsibilities: [
  'Clean and validate client datasets',
  'Build scheduled reports in the BI tool',
  'Present weekly findings to the analytics lead'],

  status: 'PUBLISHED',
  createdAt: '2026-07-30',
  publishedAt: '2026-08-05',
  approvedById: 'coord-1'
},
{
  id: 'opp-5',
  title: 'Telecommunications Support Attachment',
  description:
  'Join the field operations team maintaining fibre and wireless last-mile links across Nyeri County, including customer installations and fault resolution.',
  companyId: 'co-5',
  department: 'Field Operations',
  industry: 'Telecommunications',
  location: 'Main Street, Kisumu',
  town: 'Kisumu',
  workMode: 'ONSITE',
  startDate: '2026-09-01',
  endDate: '2026-11-21',
  durationWeeks: 12,
  slots: 3,
  slotsFilled: 1,
  applicationDeadline: '2026-08-29',
  requirements: [
  'Networking or telecommunications coursework',
  'University introduction letter and valid insurance cover'],

  preferredSkills: ['Networking', 'Fibre optics', 'IoT', 'Customer support'],
  responsibilities: [
  'Assist with customer premises installations',
  'Support fault diagnosis on last-mile links',
  'Maintain the field asset register'],

  status: 'PUBLISHED',
  createdAt: '2026-07-10',
  publishedAt: '2026-07-16',
  approvedById: 'coord-1'
},
{
  id: 'opp-6',
  title: 'Cloud & DevOps Attachment',
  description:
  'Support the platform reliability group in maintaining CI pipelines, container images and monitoring dashboards for DumuTech services.',
  companyId: 'co-1',
  department: 'Platform Reliability',
  industry: 'Software & IT Services',
  location: 'Westlands, Nairobi',
  town: 'Nairobi',
  workMode: 'HYBRID',
  startDate: '2026-10-05',
  endDate: '2026-12-24',
  durationWeeks: 12,
  slots: 2,
  slotsFilled: 0,
  applicationDeadline: '2026-09-25',
  requirements: [
  'Familiarity with Linux and version control',
  'University introduction letter and valid insurance cover'],

  preferredSkills: ['Docker', 'Linux administration', 'CI/CD', 'AWS'],
  responsibilities: [
  'Maintain build pipelines under supervision',
  'Assist with monitoring and alert tuning',
  'Document runbooks'],

  status: 'PENDING_APPROVAL',
  createdAt: '2026-08-24',
  publishedAt: null
},
{
  id: 'opp-7',
  title: 'Embedded Systems Attachment',
  description:
  'Draft posting for an embedded systems attachment supporting the industrial controls team. Scope and slot count still being confirmed internally.',
  companyId: 'co-2',
  department: 'Industrial Controls',
  industry: 'Network & Infrastructure',
  location: 'Kenyatta Avenue, Nakuru',
  town: 'Nakuru',
  workMode: 'ONSITE',
  startDate: '2026-10-12',
  endDate: '2027-01-01',
  durationWeeks: 12,
  slots: 1,
  slotsFilled: 0,
  applicationDeadline: '2026-10-01',
  requirements: ['Electronics or embedded coursework'],
  preferredSkills: ['C', 'Microcontrollers', 'Electronics'],
  responsibilities: ['Assist with firmware testing'],
  status: 'DRAFT',
  createdAt: '2026-08-25',
  publishedAt: null
},
{
  id: 'opp-8',
  title: 'Business Intelligence Reporting Attachment',
  description:
  'Closed posting from the May–August 2026 cycle. Retained for records and reporting.',
  companyId: 'co-3',
  department: 'Analytics',
  industry: 'Data & Analytics',
  location: 'Oloo Street, Eldoret',
  town: 'Eldoret',
  workMode: 'ONSITE',
  startDate: '2026-05-11',
  endDate: '2026-08-07',
  durationWeeks: 13,
  slots: 2,
  slotsFilled: 2,
  applicationDeadline: '2026-04-24',
  requirements: ['Database coursework', 'University introduction letter'],
  preferredSkills: ['SQL', 'Power BI', 'Excel'],
  responsibilities: ['Produce monthly cooperative performance reports'],
  status: 'CLOSED',
  createdAt: '2026-03-30',
  publishedAt: '2026-04-02',
  approvedById: 'coord-1'
},
{
  id: 'opp-9',
  title: 'Agri-IoT Field Attachment',
  description:
  'Support installation and calibration of soil-moisture sensor networks on partner farms across Nyeri County.',
  companyId: 'co-4',
  department: 'Field Engineering',
  industry: 'Agritech',
  location: 'Kimathi Way, Nyeri',
  town: 'Nyeri',
  workMode: 'ONSITE',
  startDate: '2026-09-28',
  endDate: '2026-12-18',
  durationWeeks: 12,
  slots: 2,
  slotsFilled: 0,
  applicationDeadline: '2026-09-18',
  requirements: ['Electronics, IT or agricultural engineering coursework'],
  preferredSkills: ['IoT', 'Electronics', 'Python'],
  responsibilities: ['Install and calibrate field sensors', 'Record field telemetry'],
  status: 'DRAFT',
  createdAt: '2026-08-22',
  publishedAt: null
},
// Prior-cycle postings that the currently active placements were made against.
{
  id: 'opp-10',
  title: 'Network Support Attachment (June cycle)',
  description:
  'June 2026 cycle posting supporting the network operations team on county and hospital installations.',
  companyId: 'co-2',
  department: 'Network Operations',
  industry: 'Network & Infrastructure',
  location: 'Kenyatta Avenue, Nakuru',
  town: 'Nakuru',
  workMode: 'ONSITE',
  startDate: '2026-06-01',
  endDate: '2026-09-04',
  durationWeeks: 13,
  slots: 2,
  slotsFilled: 1,
  applicationDeadline: '2026-05-09',
  requirements: ['Networking coursework', 'University introduction letter and insurance cover'],
  preferredSkills: ['Networking', 'Cisco IOS', 'Troubleshooting'],
  responsibilities: ['Support installations and fault resolution across client sites'],
  status: 'CLOSED',
  createdAt: '2026-04-08',
  publishedAt: '2026-04-12',
  approvedById: 'coord-1'
},
{
  id: 'opp-11',
  title: 'Data Engineering Attachment (June cycle)',
  description:
  'June 2026 cycle posting building extract and load pipelines for cooperative clients.',
  companyId: 'co-3',
  department: 'Analytics',
  industry: 'Data & Analytics',
  location: 'Oloo Street, Eldoret',
  town: 'Eldoret',
  workMode: 'ONSITE',
  startDate: '2026-06-08',
  endDate: '2026-09-11',
  durationWeeks: 13,
  slots: 2,
  slotsFilled: 1,
  applicationDeadline: '2026-05-15',
  requirements: ['Database coursework', 'University introduction letter and insurance cover'],
  preferredSkills: ['SQL', 'Python', 'ETL'],
  responsibilities: ['Build and maintain nightly data loads under review'],
  status: 'CLOSED',
  createdAt: '2026-04-14',
  publishedAt: '2026-04-18',
  approvedById: 'coord-1'
}];