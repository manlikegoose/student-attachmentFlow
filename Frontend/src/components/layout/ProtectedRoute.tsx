import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import type { UserRole } from '../../types/enums';
import { HOME_ROUTES, useAuth } from '../../contexts/AuthContext';

/**
 * Route protection is a convenience for the user, not a security control. Every service
 * call independently enforces role and object-level permissions, and the real backend
 * must do the same — see docs/domain-rules.md.
 */
export function ProtectedRoute({
  roles,
  children



}: {roles: UserRole[];children: React.ReactNode;}) {
  const { session, initialising } = useAuth();
  const location = useLocation();

  if (initialising) {
    return (
      <div className="flex min-h-full items-center justify-center py-24" role="status">
        <Loader2Icon className="h-5 w-5 animate-spin text-navy-500" aria-hidden />
        <span className="sr-only">Checking your session</span>
      </div>);

  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(session.role)) {
    return <Navigate to={HOME_ROUTES[session.role]} replace />;
  }

  return <>{children}</>;
}