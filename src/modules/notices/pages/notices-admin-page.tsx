import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  BarChart2,
  Edit,
  Copy,
  Archive,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  FileText,
  Pin,
  Eye,
  Send,
  X
} from 'lucide-react';
import { Notice, NoticeCategory, NoticeStatus, AppUser } from '../types';
import { NoticeService } from '../services/notice-service';

interface NoticesAdminPageProps {
  tenantId: string;
  currentUser: AppUser;
  categories: NoticeCategory[];
  onOpenCreate: () => void;
  onOpenEdit: (notice: Notice) => void;
  onOpenMetrics: (noticeId: string, noticeTitle: string) => void;
  onOpenDetail: (noticeId: string) => void;
  onRefreshData: () => void;
}

export function NoticesAdminPage({
  tenantId,
  currentUser,
  categories,
  onOpenCreate,
  onOpenEdit,
  onOpenMetrics,
  onOpenDetail,
  onRefreshData
}: NoticesAdminPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | NoticeStatus>('all');
  const [search, setSearch] = useState('');
  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);

  // Load notices for admin
  const notices = useMemo(() => {
    return NoticeService.getAdminNotices(tenantId, activeTab, search);
  }, [tenantId, activeTab, search]);

  const allAdminNotices = useMemo(() => {
    return NoticeService.getAdminNotices(tenantId, 'all');
  }, [tenantId]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: allAdminNotices.length,
      draft: allAdminNotices.filter((n) => n.status === 'draft').length,
      scheduled: allAdminNotices.filter((n) => n.status === 'scheduled').length,
      published: allAdminNotices.filter((n) => n.status === 'published').length,
      expired: allAdminNotices.filter((n) => n.status === 'expired').length,
      archived: allAdminNotices.filter((n) => n.status === 'archived').length
    };
  }, [allAdminNotices]);

  // Actions
  const handleDuplicate = (notice: Notice) => {
    try {
      const duplicated = NoticeService.duplicateNotice(tenantId, notice.id, currentUser);
      onRefreshData();
      onOpenEdit(duplicated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOrArchive = (notice: Notice) => {
    const isDraft = notice.status === 'draft';
    const confirmText = isDraft
      ? `¿Eliminar definitivamente el borrador "${notice.title}"? Esta acción no se puede deshacer.`
      : `¿Archivar el comunicado "${notice.title}"? Dejará de mostrarse a los destinatarios pero conservará historial, comentarios y lecturas.`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = NoticeService.deleteOrArchive(tenantId, notice.id, currentUser);
      alert(res.message);
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunScheduler = () => {
    const res = NoticeService.runScheduler(tenantId);
    setSchedulerMessage(
      `Proceso programador ejecutado: ${res.publishedCount} avisos publicados y ${res.expiredCount} expirados de forma idempotente.`
    );
    setTimeout(() => setSchedulerMessage(null), 5000);
    onRefreshData();
  };

  const getStatusBadge = (status: NoticeStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Publicado
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Programado
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            <FileText className="w-3 h-3" />
            Borrador
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Expirado
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
            <Archive className="w-3 h-3" />
            Archivado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            Gestión de Avisos y Comunicados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administra el ciclo de vida (borradores, programación, publicación, expiración y archivado).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunScheduler}
            title="Ejecuta la evaluación de fechas programadas y expiraciones"
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ejecutar Scheduler</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Redactar Comunicado</span>
          </button>
        </div>
      </div>

      {schedulerMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between animate-in fade-in">
          <span>{schedulerMessage}</span>
          <button onClick={() => setSchedulerMessage(null)} className="text-blue-500 hover:text-blue-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs of Lifecycle */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px text-xs font-semibold">
        {[
          { id: 'all', label: 'Todos', count: counts.all },
          { id: 'draft', label: 'Borradores', count: counts.draft },
          { id: 'scheduled', label: 'Programados', count: counts.scheduled },
          { id: 'published', label: 'Publicados', count: counts.published },
          { id: 'expired', label: 'Expirados', count: counts.expired },
          { id: 'archived', label: 'Archivados', count: counts.archived }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por título o resumen..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table of Notices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Comunicado</th>
                <th className="px-4 py-3">Categoría & Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Audiencia / Versión</th>
                <th className="px-4 py-3">Fechas Clave</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No hay comunicados registrados en esta pestaña.
                  </td>
                </tr>
              ) : (
                notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-slate-50/70">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        {notice.is_pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" title="Aviso fijado" />
                        )}
                        <span className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1" onClick={() => onOpenDetail(notice.id)}>
                          {notice.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {notice.summary}
                      </p>
                      <span className="text-[10px] text-slate-400">Por {notice.author_name}</span>
                    </td>

                    {/* Category & Priority */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {notice.category?.name || 'General'}
                        </span>
                        <div>
                          {notice.priority === 'critical' && (
                            <span className="text-[10px] font-bold text-red-700">Crítica</span>
                          )}
                          {notice.priority === 'important' && (
                            <span className="text-[10px] font-semibold text-amber-700">Importante</span>
                          )}
                          {notice.priority === 'normal' && (
                            <span className="text-[10px] text-slate-500">Normal</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(notice.status)}
                    </td>

                    {/* Audience & Version */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-semibold">
                        {notice.frozen_recipients_count !== undefined
                          ? `${notice.frozen_recipients_count} congelados`
                          : notice.audience_criteria.type === 'all'
                          ? 'Todo el personal'
                          : 'Segmentado'}
                      </div>
                      <span className="text-[10px] text-blue-600 font-medium">v{notice.version}</span>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      <div>Pub: {new Date(notice.publish_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</div>
                      {notice.expire_at ? (
                        <div className="text-amber-700">Exp: {new Date(notice.expire_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</div>
                      ) : (
                        <div className="text-slate-400">Sin expiración</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Preview */}
                        <button
                          type="button"
                          onClick={() => onOpenDetail(notice.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver detalle del comunicado"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* View Metrics (only if published, expired, archived) */}
                        {notice.status !== 'draft' && (
                          <button
                            type="button"
                            onClick={() => onOpenMetrics(notice.id, notice.title)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver métricas de lectura de destinatarios"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onOpenEdit(notice)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar comunicado"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Duplicate (Rule: Para ampliar destinatarios se duplicará o creará otro aviso) */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(notice)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Duplicar aviso para ampliar audiencia"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete Draft or Archive */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrArchive(notice)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            notice.status === 'draft'
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                          }`}
                          title={notice.status === 'draft' ? 'Eliminar borrador' : 'Archivar comunicado'}
                        >
                          {notice.status === 'draft' ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
