import {
  BellRing,
  Pin,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Notice } from '../types';

interface HomeNoticesWidgetProps {
  notices: Notice[];
  onOpenNotice: (noticeId: string) => void;
  onGoToFeed: () => void;
}

export function HomeNoticesWidget({ notices, onOpenNotice, onGoToFeed }: HomeNoticesWidgetProps) {
  const unreadCount = notices.filter(n => !n.is_read).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Avisos Recientes para Ti</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Prioridad a fijados, críticos y novedades dirigidas a tu perfil
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToFeed}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List of up to 5 notices */}
      <div className="divide-y divide-slate-100">
        {notices.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
            <p className="text-xs font-medium text-slate-600">Estás al día</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No hay avisos pendientes para tu sucursal o rol.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const isUnread = !notice.is_read;
            return (
              <div
                key={notice.id}
                onClick={() => onOpenNotice(notice.id)}
                className={`p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                  notice.is_pinned ? 'bg-amber-50/30' : isUnread ? 'bg-blue-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 shrink-0">
                    {notice.is_pinned ? (
                      <Pin className="w-4 h-4 text-amber-600 fill-amber-600" title="Aviso fijado" />
                    ) : notice.priority === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" title="Prioridad crítica" />
                    ) : notice.priority === 'important' ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" title="Prioridad importante" />
                    ) : (
                      <Info className="w-4 h-4 text-slate-400" title="Aviso normal" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {notice.category && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {notice.category.name}
                        </span>
                      )}
                      {notice.priority === 'critical' && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                          CRÍTICO
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" title="Pendiente de leer" />
                      )}
                    </div>

                    <h4 className={`text-xs text-slate-900 line-clamp-1 leading-snug ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                      {notice.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {notice.summary}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notice.publish_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
