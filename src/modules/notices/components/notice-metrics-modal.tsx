import { useState, useMemo } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Clock,
  Search,
  CheckCheck,
  Calendar
} from 'lucide-react';
import { NoticeMetrics } from '../types';

interface NoticeMetricsModalProps {
  metrics: NoticeMetrics;
  noticeTitle: string;
  onClose: () => void;
}

export function NoticeMetricsModal({ metrics, noticeTitle, onClose }: NoticeMetricsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredRecipients = useMemo(() => {
    return metrics.recipients.filter((rec) => {
      if (statusFilter === 'read' && !rec.read_at) return false;
      if (statusFilter === 'unread' && rec.read_at) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesName = rec.user_name.toLowerCase().includes(s);
        const matchesEmail = rec.user_email.toLowerCase().includes(s);
        const matchesRole = rec.user_role.toLowerCase().includes(s);
        const matchesBranch = rec.user_branch ? rec.user_branch.toLowerCase().includes(s) : false;
        if (!matchesName && !matchesEmail && !matchesRole && !matchesBranch) return false;
      }
      return true;
    });
  }, [metrics.recipients, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredRecipients.length / pageSize) || 1;
  const paginatedRecipients = filteredRecipients.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
              Métricas de Lectura y Audiencia
            </h2>
            <p className="text-xs text-slate-500 truncate mt-0.5" title={noticeTitle}>
              {noticeTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Total Enviados
              </span>
              <div className="text-2xl font-black text-blue-900 mt-1 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-blue-600" />
                {metrics.total_delivered}
              </div>
              <span className="text-[10px] text-blue-600 mt-0.5 block">Destinatarios congelados</span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Leídos
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {metrics.total_read}
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Confirmados en detalle</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Pendientes
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-amber-600" />
                {metrics.total_unread}
              </div>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Sin abrir el comunicado</span>
            </div>

            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Tasa de Lectura
              </span>
              <div className="text-2xl font-black text-purple-900 mt-1 flex items-center gap-1">
                {metrics.read_percentage}%
              </div>
              {/* Progress bar */}
              <div className="w-full bg-purple-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${metrics.read_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({metrics.recipients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('read');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'read' ? 'bg-white shadow-xs text-emerald-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leídos ({metrics.total_read})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('unread');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'unread' ? 'bg-white shadow-xs text-amber-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendientes ({metrics.total_unread})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre o rol..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 w-48 sm:w-56 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Recipients List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-3.5 py-2.5">Colaborador</th>
                  <th className="px-3.5 py-2.5">Rol / Sucursal</th>
                  <th className="px-3.5 py-2.5">Estado</th>
                  <th className="px-3.5 py-2.5">Fecha Lectura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-6 text-center text-slate-400 italic">
                      No se encontraron destinatarios con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  paginatedRecipients.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-900">{rec.user_name}</div>
                        <div className="text-[10px] text-slate-400">{rec.user_email}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        <div>{rec.user_role}</div>
                        <div className="text-[10px] text-slate-400">{rec.user_branch || 'General'}</div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {rec.read_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCheck className="w-3 h-3" />
                            Leído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500">
                        {rec.read_at ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(rec.read_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredRecipients.length)} de {filteredRecipients.length}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-2.5 py-1 rounded-md border border-slate-300 bg-white font-medium disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded-md border border-slate-300 bg-white font-medium disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
          >
            Cerrar Métricas
          </button>
        </div>
      </div>
    </div>
  );
}
