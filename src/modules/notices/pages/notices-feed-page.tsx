import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Pin,
  CheckCircle2,
  Clock,
  Inbox,
  AlertTriangle,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Notice, NoticeCategory, NoticePriority, AppUser } from '../types';
import { NoticeCard } from '../components/notice-card';

interface NoticesFeedPageProps {
  notices: Notice[];
  categories: NoticeCategory[];
  currentUser: AppUser;
  onOpenDetail: (noticeId: string) => void;
}

export function NoticesFeedPage({
  notices,
  categories,
  currentUser,
  onOpenDetail
}: NoticesFeedPageProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [readStatus, setReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [includeExpired, setIncludeExpired] = useState(false);

  // Filter notices
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      // Expiration filter
      if (!includeExpired && notice.status === 'expired') return false;

      // Category filter
      if (selectedCategory !== 'all' && notice.category_id !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && notice.priority !== selectedPriority) {
        return false;
      }

      // Read status filter
      if (readStatus === 'read' && !notice.is_read) return false;
      if (readStatus === 'unread' && notice.is_read) return false;

      // Search filter
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesTitle = notice.title.toLowerCase().includes(s);
        const matchesSummary = notice.summary.toLowerCase().includes(s);
        if (!matchesTitle && !matchesSummary) return false;
      }

      return true;
    });
  }, [notices, includeExpired, selectedCategory, selectedPriority, readStatus, search]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => c.is_active);
  }, [categories]);

  const unreadTotal = notices.filter(n => !n.is_read && n.status === 'published').length;

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setReadStatus('all');
    setIncludeExpired(false);
  };

  const hasActiveFilters = search || selectedCategory !== 'all' || selectedPriority !== 'all' || readStatus !== 'all' || includeExpired;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Portal de Comunicación Interna</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Avisos y Comunicados Oficiales
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Mantente al tanto de novedades, protocolos de operación, políticas corporativas y promociones vigentes dirigidas a tu posición.
          </p>
        </div>

        {unreadTotal > 0 && (
          <div className="mt-4 sm:mt-0 sm:absolute sm:top-6 sm:right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center">
            <span className="text-2xl font-black text-white block">{unreadTotal}</span>
            <span className="text-[11px] text-blue-200 block font-medium">Avisos por leer</span>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o contenido del aviso..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Quick Filter: Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las Categorías</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Quick Filter: Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="critical">Solo Críticos</option>
            <option value="important">Solo Importantes</option>
            <option value="normal">Normal</option>
          </select>

          {/* Read Status Switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setReadStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                readStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setReadStatus('unread')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                readStatus === 'unread' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sin leer
            </button>
            <button
              type="button"
              onClick={() => setReadStatus('read')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                readStatus === 'read' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leídos
            </button>
          </div>
        </div>

        {/* Secondary Bar: Expired Toggle & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <span>Incluir avisos expirados en el historial</span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-700">No se encontraron comunicados</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Prueba ajustando los términos de búsqueda o limpiando los filtros seleccionados.'
              : 'No hay avisos publicados dirigidos a tu perfil o sucursal por el momento.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
