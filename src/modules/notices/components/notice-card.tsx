import React from 'react';
import {
  Pin,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  User,
  Paperclip,
  MessageSquare,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Notice, NoticePriority } from '../types';

interface NoticeCardProps {
  key?: React.Key;
  notice: Notice;
  onOpenDetail: (noticeId: string) => void;
  compact?: boolean;
}

export function NoticeCard({ notice, onOpenDetail, compact = false }: NoticeCardProps) {
  const getPriorityInfo = (priority: NoticePriority) => {
    switch (priority) {
      case 'critical':
        return {
          label: 'Crítico',
          icon: AlertTriangle,
          badgeClass: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'important':
        return {
          label: 'Importante',
          icon: AlertCircle,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      default:
        return {
          label: 'Normal',
          icon: Info,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const getCategoryColor = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const priority = getPriorityInfo(notice.priority);
  const PriorityIcon = priority.icon;
  const isUnread = !notice.is_read;

  if (compact) {
    return (
      <div
        onClick={() => onOpenDetail(notice.id)}
        className="group relative flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center gap-1.5">
            {isUnread && <span className="w-2 h-2 rounded-full bg-blue-600 block" title="No leído" />}
            {notice.is_pinned && (
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" title="Aviso fijado" />
            )}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${priority.badgeClass}`}>
              <PriorityIcon className="w-2.5 h-2.5" />
              {priority.label}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {notice.title}
            </h4>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {notice.summary}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 pl-3">
          <span className="text-[10px] text-slate-400">
            {new Date(notice.publish_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenDetail(notice.id)}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white overflow-hidden transition-all duration-200 cursor-pointer ${
        notice.is_pinned
          ? 'border-amber-300/80 shadow-xs hover:shadow-md hover:border-amber-400 bg-gradient-to-b from-amber-50/20 to-white'
          : isUnread
          ? 'border-blue-200 shadow-xs hover:shadow-md hover:border-blue-400'
          : 'border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Cover Image if present */}
      {notice.cover_image_url && (
        <div className="w-full h-36 overflow-hidden bg-slate-100 relative">
          <img
            src={notice.cover_image_url}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {notice.is_pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  <Pin className="w-3 h-3 text-amber-700 fill-amber-700" />
                  Fijado
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${priority.badgeClass}`}>
                <PriorityIcon className="w-3 h-3" />
                {priority.label}
              </span>

              {notice.category && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getCategoryColor(notice.category.color)}`}>
                  {notice.category.name}
                </span>
              )}

              {notice.status === 'expired' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
                  Expirado
                </span>
              )}
            </div>

            {/* Read status pill */}
            <div>
              {notice.is_read ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Leído
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Nuevo
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {notice.title}
          </h3>

          {/* Summary */}
          <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {notice.summary}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {notice.author_name}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(notice.publish_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {notice.allow_comments && (
              <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600" title="Comentarios activos">
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
              Ver
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
