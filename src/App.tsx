import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Building2,
  Users,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Tag,
  PlusCircle,
  Cpu,
  ChevronDown,
  LogOut,
  Home,
  Compass,
  AlertCircle
} from 'lucide-react';
import {
  Tenant,
  AppUser,
  Notice,
  NoticeCategory,
  NoticeMetrics
} from './modules/notices/types';
import { NoticeService } from './modules/notices/services/notice-service';
import { getDatabase, seedDatabase } from './modules/notices/services/storage';
import { NotificationBell } from './components/notification-bell';
import { NoticeDetailModal } from './modules/notices/components/notice-detail-modal';
import { NoticeEditorWizard } from './modules/notices/components/notice-editor-wizard';
import { NoticeMetricsModal } from './modules/notices/components/notice-metrics-modal';
import { CategoriesManagerModal } from './modules/notices/components/categories-manager-modal';
import { TestPlanSuiteModal } from './modules/notices/components/test-plan-suite-modal';
import { HomeDashboardPage } from './modules/notices/pages/home-dashboard-page';
import { NoticesFeedPage } from './modules/notices/pages/notices-feed-page';
import { NoticesAdminPage } from './modules/notices/pages/notices-admin-page';

export default function App() {
  // Database seed state
  const [dataVersion, setDataVersion] = useState(0);

  // Active Tenant & User
  const [tenantId, setTenantId] = useState<string>('tenant-alsea');
  const [userId, setUserId] = useState<string>('user-carlos'); // Start as Admin

  // Active Top-level Navigation View
  const [currentView, setCurrentView] = useState<'home' | 'feed' | 'admin'>('home');

  // Modals state
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null | undefined>(undefined); // undefined = closed, null = new, Notice = edit
  const [metricsNotice, setMetricsNotice] = useState<{ id: string; title: string } | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showTestPlanModal, setShowTestPlanModal] = useState(false);

  // Load database metadata
  const db = useMemo(() => {
    return getDatabase();
  }, [dataVersion]);

  // Current Tenant object
  const currentTenant = useMemo(() => {
    return db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  }, [db.tenants, tenantId]);

  // Tenant users
  const tenantUsers = useMemo(() => {
    return db.users.filter((u) => u.tenant_id === tenantId);
  }, [db.users, tenantId]);

  // Current User object
  const currentUser = useMemo(() => {
    return tenantUsers.find((u) => u.id === userId) || tenantUsers[0];
  }, [tenantUsers, userId]);

  // Current Tenant Categories
  const categories = useMemo(() => {
    return NoticeService.getCategories(tenantId);
  }, [tenantId, dataVersion]);

  // Permissions for Current User
  const userPermissions = useMemo(() => {
    const role = db.roles.find((r) => r.id === currentUser?.role_id);
    return role?.permissions || [];
  }, [db.roles, currentUser]);

  const canManageNotices = userPermissions.includes('notices.publish') || userPermissions.includes('notices.view_admin');
  const canManageCategories = userPermissions.includes('notices.manage_categories');

  // If user switches to a non-admin role while in admin view, redirect to feed
  useEffect(() => {
    if (currentView === 'admin' && !canManageNotices) {
      setCurrentView('feed');
    }
  }, [currentUser, currentView, canManageNotices]);

  // When switching tenant, select the first user of that tenant
  const handleTenantChange = (newTenantId: string) => {
    setTenantId(newTenantId);
    const firstUser = db.users.find((u) => u.tenant_id === newTenantId && u.is_internal && u.is_active);
    if (firstUser) {
      setUserId(firstUser.id);
    }
    setDataVersion((v) => v + 1);
  };

  // Personal feed notices
  const personalFeed = useMemo(() => {
    if (!currentUser) return [];
    return NoticeService.getPersonalFeed(tenantId, currentUser.id);
  }, [tenantId, currentUser, dataVersion]);

  // Home prioritized notices (up to 5)
  const homeNotices = useMemo(() => {
    if (!currentUser) return [];
    return NoticeService.getHomeNotices(tenantId, currentUser.id);
  }, [tenantId, currentUser, dataVersion]);

  // Metrics for modal
  const activeMetrics: NoticeMetrics | null = useMemo(() => {
    if (!metricsNotice) return null;
    try {
      return NoticeService.getMetrics(tenantId, metricsNotice.id);
    } catch {
      return null;
    }
  }, [tenantId, metricsNotice, dataVersion]);

  // Refresh helper
  const handleRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Módulo de Avisos
                </span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0 Corporativo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Comunicación interna, vigencias, métricas y segmentación por sucursal
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'home'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('feed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'feed'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Avisos</span>
              {homeNotices.filter((n) => !n.is_read).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {canManageNotices && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Administración</span>
              </button>
            )}
          </nav>

          {/* Right Controls: Tenant Switcher, User Switcher, Bell */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Automated Test Suite Button */}
            <button
              type="button"
              onClick={() => setShowTestPlanModal(true)}
              title="Abrir Plan de Pruebas Automatizadas del Prompt"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xl:inline">Plan de Pruebas</span>
            </button>

            {/* Category Modal Button (for managers) */}
            {canManageCategories && (
              <button
                type="button"
                onClick={() => setShowCategoriesModal(true)}
                title="Administrar categorías configurables de la empresa"
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Tag className="w-4 h-4" />
              </button>
            )}

            {/* Notification Bell with Socket simulation */}
            {currentUser && (
              <NotificationBell
                tenantId={tenantId}
                userId={currentUser.id}
                onOpenNotice={(noticeId) => setActiveNoticeId(noticeId)}
              />
            )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Tenant Switcher Dropdown */}
            <div className="relative">
              <select
                value={tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Cambiar empresa (Tenant isolation)"
              >
                {db.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏢 {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Switcher Dropdown */}
            <div className="relative">
              <select
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setDataVersion((v) => v + 1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Cambiar usuario para probar segmentación"
              >
                {tenantUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.role_label} - {u.branch_name || 'Corporativo'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Submenu Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold">
          <button
            onClick={() => setCurrentView('home')}
            className={`py-1 px-3 rounded-lg ${currentView === 'home' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Inicio
          </button>
          <button
            onClick={() => setCurrentView('feed')}
            className={`py-1 px-3 rounded-lg ${currentView === 'feed' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Avisos
          </button>
          {canManageNotices && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`py-1 px-3 rounded-lg ${currentView === 'admin' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
            >
              Administración
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'home' && currentUser && (
          <HomeDashboardPage
            tenant={currentTenant}
            currentUser={currentUser}
            homeNotices={homeNotices}
            onOpenNotice={(id) => setActiveNoticeId(id)}
            onGoToFeed={() => setCurrentView('feed')}
            onOpenAdmin={canManageNotices ? () => setCurrentView('admin') : undefined}
          />
        )}

        {currentView === 'feed' && currentUser && (
          <NoticesFeedPage
            notices={personalFeed}
            categories={categories}
            currentUser={currentUser}
            onOpenDetail={(id) => setActiveNoticeId(id)}
          />
        )}

        {currentView === 'admin' && currentUser && (
          <NoticesAdminPage
            tenantId={tenantId}
            currentUser={currentUser}
            categories={categories}
            onOpenCreate={() => setEditingNotice(null)}
            onOpenEdit={(notice) => setEditingNotice(notice)}
            onOpenMetrics={(noticeId, title) => setMetricsNotice({ id: noticeId, title })}
            onOpenDetail={(id) => setActiveNoticeId(id)}
            onRefreshData={handleRefresh}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Notice Detail Modal (View, Read confirmation, Files, Versions, Comments) */}
      {activeNoticeId && currentUser && (
        <NoticeDetailModal
          noticeId={activeNoticeId}
          tenantId={tenantId}
          currentUser={currentUser}
          onClose={() => {
            setActiveNoticeId(null);
            handleRefresh();
          }}
        />
      )}

      {/* 2. Notice Editor Wizard (3-step with live audience preview) */}
      {editingNotice !== undefined && currentUser && (
        <NoticeEditorWizard
          initialNotice={editingNotice}
          tenantId={tenantId}
          currentUser={currentUser}
          categories={categories}
          roles={db.roles}
          branches={db.branches.filter((b) => b.tenant_id === tenantId)}
          allUsers={db.users}
          onClose={() => setEditingNotice(undefined)}
          onSaved={() => {
            setEditingNotice(undefined);
            handleRefresh();
          }}
        />
      )}

      {/* 3. Notice Metrics & Recipients Modal */}
      {metricsNotice && activeMetrics && (
        <NoticeMetricsModal
          metrics={activeMetrics}
          noticeTitle={metricsNotice.title}
          onClose={() => setMetricsNotice(null)}
        />
      )}

      {/* 4. Categories Manager Modal */}
      {showCategoriesModal && currentUser && (
        <CategoriesManagerModal
          tenantId={tenantId}
          userId={currentUser.id}
          categories={categories}
          onClose={() => setShowCategoriesModal(false)}
          onUpdated={handleRefresh}
        />
      )}

      {/* 5. Test Plan Suite Modal */}
      {showTestPlanModal && (
        <TestPlanSuiteModal
          onClose={() => {
            setShowTestPlanModal(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
