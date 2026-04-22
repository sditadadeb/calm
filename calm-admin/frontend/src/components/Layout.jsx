import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  RefreshCw,
  Settings,
  LogOut,
  User,
  UserPlus,
  Lightbulb,
  Sun,
  Moon,
  Search,
  TrendingUp
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
  const [syncProgress, setSyncProgress] = useState({ message: '', current: 0, total: 0, percent: 0, phase: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const pageConfig = {
    '/': { name: t('nav.dashboard'), subtitle: t('nav.dashboardSub'), icon: LayoutDashboard },
    '/transcriptions': { name: t('nav.transcriptions'), subtitle: t('nav.transcriptionsSub'), icon: FileText },
    '/search': { name: t('nav.search'), subtitle: t('nav.searchSub'), icon: Search },
    '/sellers': { name: t('nav.sellers'), subtitle: t('nav.sellersSub'), icon: Users },
    '/branches': { name: t('nav.branches'), subtitle: t('nav.branchesSub'), icon: Building2 },
    '/recommendations': { name: t('nav.recommendations'), subtitle: t('nav.recommendationsSub'), icon: Lightbulb },
    '/timeline': { name: t('nav.timeline'), subtitle: t('nav.timelineSub'), icon: TrendingUp },
    '/users': { name: t('nav.users'), subtitle: t('nav.usersSub'), icon: UserPlus },
    '/settings': { name: t('nav.settings'), subtitle: t('nav.settingsSub'), icon: Settings },
  };

  const baseNavigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.transcriptions'), href: '/transcriptions', icon: FileText },
    { name: t('nav.search'), href: '/search', icon: Search },
    { name: t('nav.sellers'), href: '/sellers', icon: Users },
    { name: t('nav.branches'), href: '/branches', icon: Building2 },
    { name: t('nav.recommendations'), href: '/recommendations', icon: Lightbulb },
  ];

  const adminNavigation = [
    { name: t('nav.timeline'), href: '/timeline', icon: TrendingUp },
    { name: t('nav.users'), href: '/users', icon: UserPlus },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    if (!dashboardMetrics) {
      fetchDashboardMetrics();
    }
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setSyncProgress({ message: 'Conectando...', current: 0, total: 0, percent: 0, phase: 'connecting' });
    
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    
    let lastProgress = { imported: 0, analyzed: 0 };
    
    const eventSource = new EventSource(`${apiUrl}/sync/stream?token=${token}`);
    
    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSyncProgress({
          message: data.message || '',
          current: data.current || 0,
          total: data.total || 0,
          percent: data.percent || 0,
          phase: data.type || ''
        });
        
        if (data.type === 'import_complete') {
          lastProgress.imported = data.current;
        }
        if (data.type === 'analyze_progress' || data.type === 'complete') {
          lastProgress.analyzed = data.current;
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    });
    
    eventSource.addEventListener('result', (e) => {
      try {
        const result = JSON.parse(e.data);
        lastProgress = { imported: result.imported, analyzed: result.analyzed };
      } catch (err) {
        console.error('Error parsing result:', err);
      }
    });
    
    eventSource.addEventListener('error', (e) => {
      console.error('SSE Error:', e);
      eventSource.close();
      setSyncing(false);
      setSyncProgress({ message: '', current: 0, total: 0, percent: 0, phase: '' });
      
      if (eventSource.readyState === EventSource.CLOSED) {
        fetchDashboardMetrics();
        fetchTranscriptions();
        alert(`✓ Sincronización completada\nImportadas: ${lastProgress.imported}\nAnalizadas: ${lastProgress.analyzed}`);
      } else {
        alert('Error durante la sincronización');
      }
    });
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-[#F6F6F6]'}`}>
      {/* Sidebar — azul institucional */}
      <aside className="w-64 flex flex-col" style={{ background: isDark ? '#0f2244' : '#0862C5' }}>
        {/* Logo horizontal */}
        <div className="p-5 border-b border-white/10">
          <img
            src="/logo-horizontal.png"
            alt="Banco de Occidente"
            className="h-9 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-xs mt-2 text-blue-200/70">{t('nav.adminPanel')}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 px-3 text-blue-200/50">
            {t('nav.menu')}
          </p>
          <div className="space-y-1">
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#0862C5] font-semibold shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
            
            {isAdmin && (
              <>
                <div className="border-t border-white/10 my-4" />
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3 text-blue-200/50">
                  {t('nav.admin')}
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 ${
                        isActive
                          ? 'bg-white text-[#0862C5] font-semibold shadow-sm'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Sync Button */}
                <div className="mt-4">
                  <button
                    onClick={handleSync}
                    disabled={syncing || loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white bg-[#E70518] hover:bg-[#FF283A] transition-all duration-150 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 flex-shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-sm">
                      {syncing 
                        ? (syncProgress.total > 0 
                            ? `${syncProgress.current}/${syncProgress.total}` 
                            : t('nav.connecting'))
                        : t('nav.syncS3')}
                    </span>
                  </button>
                  {syncing && syncProgress.total > 0 && (
                    <div className="mt-3">
                      <div className="w-full rounded-full h-1.5 overflow-hidden bg-white/10">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${syncProgress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2 truncate text-blue-200/70" title={syncProgress.message}>
                        {syncProgress.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white truncate">{user.username || t('nav.user')}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-blue-200/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title={t('nav.signOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isDark ? 'bg-slate-900' : 'bg-[#F6F6F6]'}`}>
        {/* Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          const PageIcon = currentPage.icon;
          return (
            <header className={`px-8 py-4 sticky top-0 z-10 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                    <PageIcon className="w-5 h-5 text-[#0081FF]" />
                  </div>
                  <div>
                    <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentPage.name}</h1>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{currentPage.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Date */}
                  <span className={`hidden sm:block text-sm px-3 py-1.5 rounded-full ${isDark ? 'text-slate-300 bg-slate-700' : 'text-gray-600 bg-gray-100'}`}>
                    {new Date().toLocaleDateString('es-CO', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  
                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('nav.attendances')}</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardMetrics?.totalTranscriptions || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('nav.conversion')}</p>
                      <p className="text-xl font-bold text-[#0081FF]">{dashboardMetrics?.conversionRate || '--'}%</p>
                    </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title={isDark ? t('nav.lightTheme') : t('nav.darkTheme')}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  {/* Language */}
                  <div className={`flex items-center rounded-lg overflow-hidden border ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
                    <button onClick={() => switchLang('es')}
                      className={`px-2 py-1.5 text-xs font-semibold transition-colors ${lang === 'es' ? 'bg-[#0081FF] text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      ES
                    </button>
                    <button onClick={() => switchLang('en')}
                      className={`px-2 py-1.5 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#0081FF] text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      EN
                    </button>
                  </div>
                </div>
              </div>
            </header>
          );
        })()}

        {/* Page content */}
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
