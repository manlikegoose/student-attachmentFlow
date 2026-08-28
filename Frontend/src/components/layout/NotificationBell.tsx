import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatRelative } from '../../utils/format';
import { useNotifications } from '../../contexts/NotificationContext';
import { Dropdown } from '../ui/Dropdown';
import { EmptyState } from '../ui/States';

export function NotificationBell({ allNotificationsPath }: {allNotificationsPath: string;}) {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const recent = notifications.slice(0, 6);

  return (
    <Dropdown
      label="Notifications"
      width="w-[22rem]"
      trigger={({ toggle, open }) =>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'relative rounded-md p-2 text-slate-500 transition-colors duration-150 ease-smooth hover:bg-slate-100 hover:text-navy-900',
          open && 'bg-slate-100 text-navy-900'
        )}>
        
          <BellIcon className="h-[18px] w-[18px]" aria-hidden />
          {unread > 0 &&
        <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rejected-solid px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
        }
        </button>
      }>
      
      {({ close }) =>
      <>
          <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5">
            <p className="text-[13px] font-semibold text-navy-900">Notifications</p>
            {unread > 0 &&
          <button
            type="button"
            onClick={() => markAllRead()}
            className="flex items-center gap-1 text-[12px] font-medium text-navy-600 transition-colors duration-150 ease-smooth hover:text-navy-800">
            
                <CheckCheckIcon className="h-3.5 w-3.5" aria-hidden />
                Mark all read
              </button>
          }
          </div>

          {recent.length === 0 ?
        <EmptyState title="No notifications" description="Workflow updates will appear here." /> :

        <ul className="max-h-96 overflow-y-auto">
              {recent.map((n) =>
          <li key={n.id}>
                  <button
              type="button"
              onClick={() => {
                if (!n.read) markRead(n.id);
                close();
                if (n.link) navigate(n.link);
              }}
              className="flex w-full gap-2.5 border-b border-slate-100 px-3.5 py-3 text-left transition-colors duration-150 ease-smooth last:border-0 hover:bg-slate-50">
              
                    <span
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                  n.read ? 'bg-transparent' : 'bg-navy-600'
                )}
                aria-hidden />
              
                    <span className="min-w-0 flex-1">
                      <span
                  className={cn(
                    'block text-[13px] leading-snug',
                    n.read ? 'text-slate-600' : 'font-semibold text-navy-900'
                  )}>
                  
                        {n.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[12px] leading-snug text-slate-500">
                        {n.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
          )}
            </ul>
        }

          <div className="border-t border-slate-200 px-3.5 py-2.5">
            <button
            type="button"
            onClick={() => {
              close();
              navigate(allNotificationsPath);
            }}
            className="text-[12px] font-medium text-navy-600 transition-colors duration-150 ease-smooth hover:text-navy-800">
            
              View all notifications
            </button>
          </div>
        </>
      }
    </Dropdown>);

}