import { useState, useRef, useEffect } from 'react';
import { Bell, Check, AlertCircle, AlertTriangle, Info, Clock, CheckCheck } from 'lucide-react';
import { NoticeNotification, NoticePriority } from '../modules/notices/types';
import { NoticeService } from '../modules/notices/services/notice-service';

interface NotificationBellProps {
  notifications?: NoticeNotification[];
  onSelectNotice?: (noticeId: string) => void;
  onOpenNotice?: (noticeId: string) => void;
  onRefresh?: () => void;
  tenantId: string;
  userId: string;
}

export function NotificationBell({
  notifications: propNotifications,
  onSelectNotice,
  onOpenNotice,
  onRefresh,
  tenantId,
  userId
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalNotifications, setInternalNotifications] = useState<NoticeNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = propNotifications ?? internalNotifications;

  const loadNotifications = () => {
    try {
      const notifs = NoticeService.getUserNotifications(tenantId, userId);
      setInternalNotifications(notifs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [tenantId, userId, isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotice = (notif: NoticeNotification) => {
    NoticeService.markNotificationAsRead(notif.id);
    loadNotifications();
    if (onRefresh) onRefresh();
    setIsOpen(false);
    if (onOpenNotice) {
      onOpenNotice(notif.notice_id);
    } else if (onSelectNotice) {
      onSelectNotice(notif.notice_id);
    }
  };

  const handleMarkAllRead = () => {
    NoticeService.markAllNotificationsAsRead(tenantId, userId);
    loadNotifications();
    if (onRefresh) onRefresh();
  };

  const getPriorityBadge = (priority: NoticePriority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            CRÍTICO
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3" />
            IMPORTANTE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            <Info className="w-3 h-3" />
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="btn-notification-bell"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Alertas de Avisos y Comunicados"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-800">Alertas de Comunicados</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No tienes avisos ni notificaciones pendientes.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleOpenNotice(notif)}
                  className={`p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-3 ${
                    !notif.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {!notif.is_read ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block mt-1" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {getPriorityBadge(notif.priority)}
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {notif.category_name}
                      </span>
                    </div>
                    <p className={`text-xs text-slate-900 leading-snug line-clamp-1 ${!notif.is_read ? 'font-semibold' : 'font-normal'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">
              Al entrar a un comunicado, se marcará automáticamente como leído.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
