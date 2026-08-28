import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/States';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDateTime, formatRelative } from '../../utils/format';

export function NotificationsPage() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Every workflow event that concerns you, newest first."
        actions={
        unread > 0 ?
        <Button
          variant="secondary"
          icon={<CheckCheckIcon className="h-3.5 w-3.5" />}
          onClick={() => markAllRead()}>
          
              Mark all as read
            </Button> :
        null
        }
        meta={unread > 0 ? <Badge tone="active">{unread} unread</Badge> : undefined} />
      

      <Card>
        {notifications.length === 0 ?
        <EmptyState
          icon={<BellIcon className="h-5 w-5" />}
          title="No notifications yet"
          description="You will be notified when your applications, documents or placement change status." /> :


        <ul className="divide-y divide-slate-100">
            {notifications.map((n) =>
          <li key={n.id}>
                <button
              type="button"
              onClick={() => {
                if (!n.read) markRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-150 ease-smooth hover:bg-slate-50',
                !n.read && 'bg-navy-50/40'
              )}>
              
                  <span
                className={cn(
                  'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
                  n.read ? 'bg-transparent' : 'bg-navy-600'
                )}
                aria-hidden />
              
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                    className={cn(
                      'text-[13px]',
                      n.read ? 'text-slate-700' : 'font-semibold text-navy-900'
                    )}>
                    
                        {n.title}
                      </span>
                      <Badge tone="muted">{n.type.toLowerCase()}</Badge>
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">
                      {n.message}
                    </span>
                    <span
                  className="mt-1.5 block text-[11px] text-slate-400"
                  title={formatDateTime(n.createdAt)}>
                  
                      {formatRelative(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
          )}
          </ul>
        }
      </Card>
    </>);

}