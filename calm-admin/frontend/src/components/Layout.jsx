import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Users, Building2, RefreshCw,
  Settings, LogOut, User, UserPlus, Sun, Moon, Search, TrendingUp
} from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, fetchDashboardMetrics, fetchTranscriptions, dashboardMetrics } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, switchLang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ message: '', current: 0, total: 0, percent: 0 });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const pageConfig = {
    '/':               { name: t('nav.dashboard'),       subtitle: t('nav.dashboardSub'),       icon: LayoutDashboard },
    '/transcriptions': { name: t('nav.transcriptions'),  subtitle: t('nav.transcriptionsSub'),  icon: FileText },
    '/search':         { name: t('nav.search'),          subtitle: t('nav.searchSub'),          icon: Search },
    '/sellers':        { name: t('nav.sellers'),         subtitle: t('nav.sellersSub'),         icon: Users },
    '/branches':       { name: t('nav.branches'),        subtitle: t('nav.branchesSub'),        icon: Building2 },
    '/timeline':       { name: t('nav.timeline'),        subtitle: t('nav.timelineSub'),        icon: TrendingUp },
    '/users':          { name: t('nav.users'),           subtitle: t('nav.usersSub'),           icon: UserPlus },
    '/settings':       { name: t('nav.settings'),        subtitle: t('nav.settingsSub'),        icon: Settings },
  };

  const baseNavigation = [
    { name: t('nav.dashboard'),       href: '/',               icon: LayoutDashboard },
    { name: t('nav.transcriptions'),  href: '/transcriptions', icon: FileText },
    { name: t('nav.search'),          href: '/search',         icon: Search },
    { name: t('nav.sellers'),         href: '/sellers',        icon: Users },
    { name: t('nav.branches'),        href: '/branches',       icon: Building2 },
  ];

  const adminNavigation = [
    { name: t('nav.timeline'), href: '/timeline', icon: TrendingUp },
    { name: t('nav.users'),    href: '/users',    icon: UserPlus },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    if (!dashboardMetrics) fetchDashboardMetrics();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setSyncProgress({ message: 'Conectando...', current: 0, total: 0, percent: 0 });
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    let lastProgress = { imported: 0, analyzed: 0 };
    const eventSource = new EventSource(`${apiUrl}/sync/stream?token=${token}`);
    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSyncProgress({ message: data.message || '', current: data.current || 0, total: data.total || 0, percent: data.percent || 0 });
        if (data.type === 'import_complete') lastProgress.imported = data.current;
        if (data.type === 'analyze_progress' || data.type === 'complete') lastProgress.analyzed = data.current;
      } catch {}
    });
    eventSource.addEventListener('result', (e) => {
      try { const r = JSON.parse(e.data); lastProgress = { imported: r.imported, analyzed: r.analyzed }; } catch {}
    });
    eventSource.addEventListener('error', () => {
      eventSource.close();
      setSyncing(false);
      setSyncProgress({ message: '', current: 0, total: 0, percent: 0 });
      if (eventSource.readyState === EventSource.CLOSED) {
        fetchDashboardMetrics();
        fetchTranscriptions();
        alert(`✓ Sincronización completada\nImportadas: ${lastProgress.imported}\nAnalizadas: ${lastProgress.analyzed}`);
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarBg   = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';
  const sidebarText = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-800' : 'bg-[#F6F6F6]'}`}>

      {/* ── Sidebar ── */}
      <aside className={`w-60 flex flex-col border-r ${sidebarBg} flex-shrink-0 h-screen sticky top-0`}>

        {/* Logo */}
        <div className={`px-4 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className={isDark ? 'bg-white rounded-xl px-3 py-2 inline-block' : undefined}>
            <img
              src="/logo-horizontal.png"
              alt="Banco de Occidente"
              className="h-16 w-auto object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 px-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
            {t('nav.menu')}
          </p>
          <div className="space-y-0.5">
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'bg-[#EBF5FF] text-[#0081FF] font-semibold border-l-[3px] border-[#0081FF]'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className={`my-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`} />
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 px-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                  {t('nav.admin')}
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.href} to={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400 font-semibold'
                            : 'bg-[#EBF5FF] text-[#0081FF] font-semibold border-l-[3px] border-[#0081FF]'
                          : isDark
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Sync */}
                <div className="mt-3">
                  <button onClick={handleSync} disabled={syncing || loading}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-[#0081FF] hover:bg-[#0862C5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 flex-shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing && syncProgress.total > 0 ? `${syncProgress.current}/${syncProgress.total}` : t('nav.syncS3')}</span>
                  </button>
                  {syncing && syncProgress.total > 0 && (
                    <div className="mt-2">
                      <div className={`w-full h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div className="h-1 rounded-full bg-[#0081FF] transition-all" style={{ width: `${syncProgress.percent}%` }} />
                      </div>
                      <p className={`text-[10px] mt-1 truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{syncProgress.message}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-[#EBF5FF]'}`}>
                <User className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-[#0081FF]'}`} />
              </div>
              <span className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{user.username}</span>
            </div>
            <button onClick={handleLogout} title={t('nav.signOut')}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={`flex-1 overflow-auto flex flex-col ${isDark ? 'bg-slate-800' : 'bg-[#F6F6F6]'}`}>

        {/* Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          const PageIcon = currentPage.icon;
          return (
            <header className={`px-7 py-3.5 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-[#EBF5FF]'}`}>
                  <PageIcon className="w-4 h-4 text-[#0081FF]" />
                </div>
                <div>
                  <h1 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentPage.name}</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{currentPage.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Métricas rápidas */}
                <div className="hidden md:flex items-center gap-5">
                  <div>
                    <p className={`text-[10px] uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('nav.attendances')}</p>
                    <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardMetrics?.totalTranscriptions ?? '--'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('nav.conversion')}</p>
                    <p className="text-lg font-bold leading-tight text-[#0081FF]">{dashboardMetrics?.conversionRate ?? '--'}%</p>
                  </div>
                </div>

                {/* Fecha */}
                <span className={`hidden sm:block text-xs px-3 py-1.5 rounded-full ${isDark ? 'text-slate-400 bg-slate-800' : 'text-gray-500 bg-gray-100'}`}>
                  {new Date().toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })}
                </span>

                {/* Tema */}
                <button onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Idioma */}
                <div className={`flex rounded-lg overflow-hidden border text-xs ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                  <button onClick={() => switchLang('es')}
                    className={`px-2.5 py-1.5 font-semibold transition-colors ${lang==='es' ? 'bg-[#0081FF] text-white' : isDark ? 'text-slate-400' : 'text-gray-500 hover:bg-gray-50'}`}>ES</button>
                  <button onClick={() => switchLang('en')}
                    className={`px-2.5 py-1.5 font-semibold transition-colors ${lang==='en' ? 'bg-[#0081FF] text-white' : isDark ? 'text-slate-400' : 'text-gray-500 hover:bg-gray-50'}`}>EN</button>
                </div>
              </div>
            </header>
          );
        })()}

        <div className="p-7 animate-fade-in flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
