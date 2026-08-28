import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { Landing } from './pages/public/Landing';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { OpportunityBoard } from './pages/public/OpportunityBoard';
import { OpportunityDetail } from './pages/public/OpportunityDetail';
import { NotFound } from './pages/public/NotFound';

import { NotificationsPage } from './pages/shared/NotificationsPage';
import { SettingsPage } from './pages/shared/SettingsPage';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentApplicationDetail } from './pages/student/StudentApplicationDetail';
import { StudentPlacement } from './pages/student/StudentPlacement';
import { StudentDocuments } from './pages/student/StudentDocuments';
import { StudentReports } from './pages/student/StudentReports';

import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';
import { CompanyOpportunities } from './pages/company/CompanyOpportunities';
import { CompanyOpportunityForm } from './pages/company/CompanyOpportunityForm';
import { CompanyOpportunityDetail } from './pages/company/CompanyOpportunityDetail';
import { CompanyApplications } from './pages/company/CompanyApplications';
import { CompanyApplicationDetail } from './pages/company/CompanyApplicationDetail';
import { CompanyInterns } from './pages/company/CompanyInterns';
import { CompanyWorkplaceSupervisors } from './pages/company/CompanyWorkplaceSupervisors';

import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CoordinatorStudents } from './pages/coordinator/CoordinatorStudents';
import { CoordinatorStudentDetail } from './pages/coordinator/CoordinatorStudentDetail';
import { CoordinatorCompanies } from './pages/coordinator/CoordinatorCompanies';
import { CoordinatorCompanyDetail } from './pages/coordinator/CoordinatorCompanyDetail';
import { CoordinatorOpportunities } from './pages/coordinator/CoordinatorOpportunities';
import { CoordinatorApplications } from './pages/coordinator/CoordinatorApplications';
import { CoordinatorApplicationDetail } from './pages/coordinator/CoordinatorApplicationDetail';
import { CoordinatorPlacements } from './pages/coordinator/CoordinatorPlacements';
import { CoordinatorPlacementDetail } from './pages/coordinator/CoordinatorPlacementDetail';
import { CoordinatorSupervisors } from './pages/coordinator/CoordinatorSupervisors';
import { CoordinatorSupervisorDetail } from './pages/coordinator/CoordinatorSupervisorDetail';
import { CoordinatorReports } from './pages/coordinator/CoordinatorReports';
import { CoordinatorAuditLog } from './pages/coordinator/CoordinatorAuditLog';

import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { SupervisorStudents } from './pages/supervisor/SupervisorStudents';
import { SupervisorPlacements } from './pages/supervisor/SupervisorPlacements';
import { SupervisorPlacementDetail } from './pages/supervisor/SupervisorPlacementDetail';
import { SupervisorStudentDetail } from './pages/supervisor/SupervisorStudentDetail';
import { SupervisorReports } from './pages/supervisor/SupervisorReports';
import { SupervisorEvaluations } from './pages/supervisor/SupervisorEvaluations';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/opportunities" element={<OpportunityBoard />} />
              <Route path="/opportunities/:id" element={<OpportunityDetail />} />

              {/* Student */}
              <Route
                element={
                <ProtectedRoute roles={['STUDENT']}>
                    <AppShell />
                  </ProtectedRoute>
                }>
                
                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/opportunities" element={<OpportunityBoard embedded />} />
                <Route path="/student/opportunities/:id" element={<OpportunityDetail embedded />} />
                <Route path="/student/applications" element={<StudentApplications />} />
                <Route path="/student/applications/:id" element={<StudentApplicationDetail />} />
                <Route path="/student/placement" element={<StudentPlacement />} />
                <Route path="/student/documents" element={<StudentDocuments />} />
                <Route path="/student/reports" element={<StudentReports />} />
                <Route path="/student/notifications" element={<NotificationsPage />} />
                <Route path="/student/settings" element={<SettingsPage />} />
              </Route>

              {/* Company */}
              <Route
                element={
                <ProtectedRoute roles={['COMPANY']}>
                    <AppShell />
                  </ProtectedRoute>
                }>
                
                <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
                <Route path="/company/dashboard" element={<CompanyDashboard />} />
                <Route path="/company/profile" element={<CompanyProfilePage />} />
                <Route path="/company/opportunities" element={<CompanyOpportunities />} />
                <Route path="/company/opportunities/new" element={<CompanyOpportunityForm />} />
                <Route path="/company/opportunities/:id" element={<CompanyOpportunityDetail />} />
                <Route path="/company/opportunities/:id/edit" element={<CompanyOpportunityForm />} />
                <Route path="/company/applications" element={<CompanyApplications />} />
                <Route path="/company/applications/:id" element={<CompanyApplicationDetail />} />
                <Route path="/company/students" element={<CompanyInterns />} />
                <Route path="/company/supervisors" element={<CompanyWorkplaceSupervisors />} />
                <Route path="/company/notifications" element={<NotificationsPage />} />
                <Route path="/company/settings" element={<SettingsPage />} />
              </Route>

              {/* Coordinator */}
              <Route
                element={
                <ProtectedRoute roles={['COORDINATOR', 'ADMIN']}>
                    <AppShell />
                  </ProtectedRoute>
                }>
                
                <Route path="/coordinator" element={<Navigate to="/coordinator/dashboard" replace />} />
                <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
                <Route path="/coordinator/students" element={<CoordinatorStudents />} />
                <Route path="/coordinator/students/:id" element={<CoordinatorStudentDetail />} />
                <Route path="/coordinator/companies" element={<CoordinatorCompanies />} />
                <Route path="/coordinator/companies/:id" element={<CoordinatorCompanyDetail />} />
                <Route path="/coordinator/opportunities" element={<CoordinatorOpportunities />} />
                <Route path="/coordinator/applications" element={<CoordinatorApplications />} />
                <Route path="/coordinator/applications/:id" element={<CoordinatorApplicationDetail />} />
                <Route path="/coordinator/placements" element={<CoordinatorPlacements />} />
                <Route path="/coordinator/placements/:id" element={<CoordinatorPlacementDetail />} />
                <Route path="/coordinator/supervisors" element={<CoordinatorSupervisors />} />
                <Route path="/coordinator/supervisors/:id" element={<CoordinatorSupervisorDetail />} />
                <Route path="/coordinator/reports" element={<CoordinatorReports />} />
                <Route path="/coordinator/audit-logs" element={<CoordinatorAuditLog />} />
                <Route path="/coordinator/settings" element={<SettingsPage />} />
              </Route>

              {/* Supervisor */}
              <Route
                element={
                <ProtectedRoute roles={['SUPERVISOR']}>
                    <AppShell />
                  </ProtectedRoute>
                }>
                
                <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />
                <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
                <Route path="/supervisor/students" element={<SupervisorStudents />} />
                <Route path="/supervisor/students/:id" element={<SupervisorStudentDetail />} />
                <Route path="/supervisor/placements" element={<SupervisorPlacements />} />
                <Route path="/supervisor/placements/:id" element={<SupervisorPlacementDetail />} />
                <Route path="/supervisor/reports" element={<SupervisorReports />} />
                <Route path="/supervisor/evaluations" element={<SupervisorEvaluations />} />
                <Route path="/supervisor/notifications" element={<NotificationsPage />} />
                <Route path="/supervisor/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>);

}