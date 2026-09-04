import {
  Bell,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Sparkles,
  Users,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Notice, AppUser, Tenant } from '../types';
import { HomeNoticesWidget } from '../components/home-notices-widget';

interface HomeDashboardPageProps {
  tenant: Tenant;
  currentUser: AppUser;
  homeNotices: Notice[];
  onOpenNotice: (noticeId: string) => void;
  onGoToFeed: () => void;
  onOpenAdmin?: () => void;
}

export function HomeDashboardPage({
  tenant,
  currentUser,
  homeNotices,
  onOpenNotice,
  onGoToFeed,
  onOpenAdmin
}: HomeDashboardPageProps) {
  const unreadCount = homeNotices.filter((n) => !n.is_read).length;
  const criticalCount = homeNotices.filter((n) => n.priority === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{tenant.name}</span>
            <span className="text-white/40">•</span>
            <span>{currentUser.branch_name || 'Corporativo Central'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hola, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bienvenido al portal corporativo interno. Consulta las novedades operativas, políticas, promociones y comunicados dirigidos a tu puesto.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToFeed}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <span>Ir al Feed de Avisos</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            {currentUser.role === 'admin' && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-colors"
              >
                Panel de Redacción y Publicación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Avisos Vigentes para Ti</span>
            <span className="text-2xl font-black text-slate-900 leading-none block mt-1">
              {homeNotices.length}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              {unreadCount} pendientes de lectura
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Tu Perfil y Rol</span>
            <span className="text-sm font-bold text-slate-900 leading-snug block mt-1">
              {currentUser.role_label}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Personal Interno Activo
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Ubicación Asignada</span>
            <span className="text-sm font-bold text-slate-900 leading-snug block mt-1">
              {currentUser.branch_name || 'Sin sucursal (Corporativo)'}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Segmentación activa
            </span>
          </div>
        </div>
      </div>

      {/* Main Home Content: Widget de Avisos Vigentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HomeNoticesWidget
            notices={homeNotices}
            onOpenNotice={onOpenNotice}
            onGoToFeed={onGoToFeed}
          />
        </div>

        {/* Corporate Guidelines Info Card */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Políticas de Comunicación</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Los comunicados emitidos en esta plataforma son de observancia oficial para el personal interno de <strong>{tenant.name}</strong>.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-1 border-t border-slate-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Al abrir un aviso, tu lectura queda confirmada y fechada.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Los archivos adjuntos están protegidos con identificador seguro.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Revisa la campana de alertas para novedades urgentes.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
