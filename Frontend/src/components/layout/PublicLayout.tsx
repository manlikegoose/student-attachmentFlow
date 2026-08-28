import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { BRAND } from '../../config/brand';
import { HOME_ROUTES, useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Brand } from './Brand';

export function PublicLayout({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full w-full flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Brand tone="light" subtitle={BRAND.institution} />
          <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Primary">
            <Link
              to="/opportunities"
              className="rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors duration-150 ease-smooth hover:text-navy-900">
              
              Opportunities
            </Link>
            {session ?
            <Button size="sm" onClick={() => navigate(HOME_ROUTES[session.role])}>
                Go to portal
              </Button> :

            <>
                <Link
                to="/login"
                className="rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors duration-150 ease-smooth hover:text-navy-900">
                
                  Sign in
                </Link>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            }
          </nav>
        </div>
      </header>

      <main className={cn('flex-1', className)}>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-slate-500 sm:px-6">
          <p>
            {BRAND.name} · {BRAND.institution} Industrial Attachment Office
          </p>
          <p>
            Support:{' '}
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="text-navy-600 underline underline-offset-2">
              
              {BRAND.supportEmail}
            </a>
          </p>
        </div>
      </footer>
    </div>);

}