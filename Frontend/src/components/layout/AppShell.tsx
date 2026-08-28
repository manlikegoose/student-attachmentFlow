import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, LogOutIcon, MenuIcon, RotateCcwIcon, SettingsIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { label } from '../../types/enums';
import { resetDatabase } from '../../services/store';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { ConfirmDialog } from '../ui/Modal';
import { Brand } from './Brand';
import { NotificationBell } from './NotificationBell';
import { SidebarContent } from './Sidebar';
import { ROLE_PORTAL_LABEL } from './navigation';

export function AppShell() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (!session) return null;
  const role = session.role;
  const base = `/${role.toLowerCase()}`;
  const settingsPath = role === 'ADMIN' ? '/coordinator/settings' : `${base}/settings`;
  const notificationsPath = role === 'ADMIN' ? '/coordinator/dashboard' : `${base}/notifications`;

  return (
    <div className="flex min-h-full w-full bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarContent role={role} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen &&
        <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
            className="absolute inset-0 bg-navy-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setDrawerOpen(false)} />
          
            <motion.div
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            
              <SidebarContent
              role={role}
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)} />
            
            </motion.div>
          </div>
        }
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-2 text-slate-600 transition-colors duration-150 ease-smooth hover:bg-slate-100 lg:hidden">
            
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="lg:hidden">
            <Brand tone="light" to={`${base}/dashboard`} />
          </div>

          <p className="hidden text-[13px] font-medium text-slate-500 lg:block">
            {ROLE_PORTAL_LABEL[role]}
          </p>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell allNotificationsPath={notificationsPath} />

            <Dropdown
              label="Account menu"
              width="w-64"
              trigger={({ toggle, open }) =>
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 transition-colors duration-150 ease-smooth hover:bg-slate-100">
                
                  <Avatar name={session.user.fullName} size="sm" />
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[10rem] truncate text-[13px] font-medium leading-tight text-navy-900">
                      {session.user.fullName}
                    </span>
                    <span className="block text-[11px] leading-tight text-slate-500">
                      {label(role)}
                    </span>
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" aria-hidden />
                </button>
              }>
              
              {({ close }) =>
              <>
                  <div className="border-b border-slate-200 px-3.5 py-3">
                    <p className="truncate text-[13px] font-semibold text-navy-900">
                      {session.user.fullName}
                    </p>
                    <p className="truncate text-[12px] text-slate-500">{session.user.email}</p>
                  </div>
                  <DropdownItem
                  icon={<SettingsIcon className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    navigate(settingsPath);
                  }}>
                  
                    Settings
                  </DropdownItem>
                  <DropdownItem
                  icon={<RotateCcwIcon className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    setConfirmReset(true);
                  }}>
                  
                    Reset demonstration data
                  </DropdownItem>
                  <div className="border-t border-slate-200">
                    <DropdownItem
                    destructive
                    icon={<LogOutIcon className="h-4 w-4" />}
                    onClick={async () => {
                      close();
                      await logout();
                      navigate('/login');
                    }}>
                    
                      Sign out
                    </DropdownItem>
                  </div>
                </>
              }
            </Dropdown>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[85rem]">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demonstration data"
        message="This restores the seeded students, companies, opportunities, applications and placements, discarding anything created during this session. Useful before running the demo again."
        confirmLabel="Reset data"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          resetDatabase();
          setConfirmReset(false);
          await logout();
          toast.success('Demonstration data restored', 'Sign in again to run the workflow from the top.');
          navigate('/login');
        }} />
      
    </div>);

}