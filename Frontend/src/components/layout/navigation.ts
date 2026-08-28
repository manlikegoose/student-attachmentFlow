import {
  BellIcon,
  BriefcaseIcon,
  Building2Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  GaugeIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../types/enums';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Grouping heading in the sidebar. */
  section: string;
  end?: boolean;
}

export const NAVIGATION: Record<UserRole, NavItem[]> = {
  STUDENT: [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, section: 'Overview' },
  { to: '/student/opportunities', label: 'Find opportunities', icon: SearchIcon, section: 'Attachment' },
  { to: '/student/applications', label: 'My applications', icon: ClipboardListIcon, section: 'Attachment' },
  { to: '/student/placement', label: 'My placement', icon: BriefcaseIcon, section: 'Attachment' },
  { to: '/student/reports', label: 'Progress reports', icon: FileTextIcon, section: 'Attachment' },
  { to: '/student/documents', label: 'Documents', icon: FileTextIcon, section: 'Account' },
  { to: '/student/profile', label: 'Profile', icon: UserIcon, section: 'Account' },
  { to: '/student/notifications', label: 'Notifications', icon: BellIcon, section: 'Account' },
  { to: '/student/settings', label: 'Settings', icon: SettingsIcon, section: 'Account' }],

  COMPANY: [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, section: 'Overview' },
  { to: '/company/opportunities', label: 'Opportunities', icon: BriefcaseIcon, section: 'Recruitment' },
  { to: '/company/applications', label: 'Applicants', icon: ClipboardListIcon, section: 'Recruitment' },
  { to: '/company/students', label: 'Interns', icon: GraduationCapIcon, section: 'Recruitment' },
  { to: '/company/supervisors', label: 'Workplace supervisors', icon: UsersIcon, section: 'Organisation' },
  { to: '/company/profile', label: 'Company profile', icon: Building2Icon, section: 'Organisation' },
  { to: '/company/notifications', label: 'Notifications', icon: BellIcon, section: 'Account' },
  { to: '/company/settings', label: 'Settings', icon: SettingsIcon, section: 'Account' }],

  COORDINATOR: [
  { to: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, section: 'Overview' },
  { to: '/coordinator/applications', label: 'University review', icon: ClipboardCheckIcon, section: 'Workflow' },
  { to: '/coordinator/placements', label: 'Placements', icon: BriefcaseIcon, section: 'Workflow' },
  { to: '/coordinator/opportunities', label: 'Opportunities', icon: SearchIcon, section: 'Workflow' },
  { to: '/coordinator/companies', label: 'Companies', icon: Building2Icon, section: 'Registers' },
  { to: '/coordinator/students', label: 'Students', icon: GraduationCapIcon, section: 'Registers' },
  { to: '/coordinator/supervisors', label: 'Supervisors', icon: UsersIcon, section: 'Registers' },
  { to: '/coordinator/reports', label: 'Reports', icon: GaugeIcon, section: 'Oversight' },
  { to: '/coordinator/audit-logs', label: 'Audit log', icon: HistoryIcon, section: 'Oversight' },
  { to: '/coordinator/settings', label: 'Settings', icon: SettingsIcon, section: 'Account' }],

  SUPERVISOR: [
  { to: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, section: 'Overview' },
  { to: '/supervisor/students', label: 'My students', icon: GraduationCapIcon, section: 'Supervision' },
  { to: '/supervisor/placements', label: 'Placements', icon: BriefcaseIcon, section: 'Supervision' },
  { to: '/supervisor/reports', label: 'Supervision reports', icon: FileTextIcon, section: 'Supervision' },
  { to: '/supervisor/evaluations', label: 'Final evaluations', icon: ClipboardCheckIcon, section: 'Supervision' },
  { to: '/supervisor/notifications', label: 'Notifications', icon: BellIcon, section: 'Account' },
  { to: '/supervisor/settings', label: 'Settings', icon: SettingsIcon, section: 'Account' }],

  ADMIN: [
  { to: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, section: 'Overview' },
  { to: '/coordinator/audit-logs', label: 'Audit log', icon: HistoryIcon, section: 'Oversight' }]

};

export const ROLE_PORTAL_LABEL: Record<UserRole, string> = {
  STUDENT: 'Student portal',
  COMPANY: 'Company portal',
  COORDINATOR: 'Attachment office',
  SUPERVISOR: 'Supervisor portal',
  ADMIN: 'Administration'
};