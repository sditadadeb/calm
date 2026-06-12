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
  TrendingUp,
  EyeOff
} from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, fetchDashboardMetrics, fetchTranscriptions, dashboardMetrics, checkPendingFromS3 } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, switchLang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
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
    '/excluded': { name: t('nav.excluded'), subtitle: t('nav.excludedSub'), icon: EyeOff },
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
    { name: t('nav.excluded'), href: '/excluded', icon: EyeOff },
    { name: t('nav.users'), href: '/users', icon: UserPlus },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const init = async () => {
      if (!sessionStorage.getItem('s3Checked')) {
        setBackgroundSync(true);
      }
      const result = await checkPendingFromS3();
      if (!result && !dashboardMetrics) {
        fetchDashboardMetrics();
      }
      if (!result) {
        fetchTranscriptions();
      }
      setBackgroundSync(false);
    };
    init();
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
    sessionStorage.removeItem('s3Checked');
    navigate('/login');
  };


  const navItemClasses = (isActive) => `relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors ${
    isActive
      ? isDark
        ? 'text-white bg-[#F5A623]/10'
        : 'text-gray-900 bg-[#F5A623]/10'
      : isDark
        ? 'text-slate-400 hover:text-white hover:bg-white/5'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;

  const ActiveBar = () => (
    <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#F5A623]" />
  );

  return (
    <div className={`min-h-screen flex brand-glow ${isDark ? 'bg-ink' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`w-56 flex flex-col border-r relative z-10 ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className={`px-4 pt-5 pb-4 mx-3 border-b ${isDark ? 'border-line' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center font-display font-bold text-[15px] text-[#16120A]"
                 style={{ background: 'linear-gradient(135deg, #F5A623, #C77E0A)' }}>
              C
            </div>
            <div>
              <span className={`font-display font-semibold text-base tracking-wide ${isDark ? 'text-white' : 'text-gray-800'}`}>CALM</span>
              <p className={`text-[10px] tracking-[0.14em] font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('nav.adminPanel').toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {t('nav.menu')}
          </p>
          <div className="space-y-0.5">
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href} className={navItemClasses(isActive)}>
                  {isActive && <ActiveBar />}
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-[#F5A623]' : ''}`} strokeWidth={1.8} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {isAdmin && (
              <>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-3 pt-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t('nav.admin')}
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href} className={navItemClasses(isActive)}>
                      {isActive && <ActiveBar />}
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#F5A623]' : ''}`} strokeWidth={1.8} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Sync Button */}
                <div className="mt-5 px-1">
                  <button
                    onClick={handleSync}
                    disabled={syncing || loading}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[13px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'border-line-strong text-slate-300 hover:text-white hover:border-white/25 bg-transparent'
                        : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 bg-transparent'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-[#F5A623]' : ''}`} strokeWidth={1.8} />
                    <span>
                      {syncing 
                        ? (syncProgress.total > 0 
                            ? `${syncProgress.current}/${syncProgress.total}` 
                            : t('nav.connecting'))
                        : t('nav.syncS3')}
                    </span>
                  </button>
                  {syncing && syncProgress.total > 0 && (
                    <div className="mt-3">
                      <div className={`w-full rounded-full h-1 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-[#F5A623] h-1 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${syncProgress.percent}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-2 truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`} title={syncProgress.message}>
                        {syncProgress.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto relative z-10 ${isDark ? 'bg-ink' : 'bg-gray-50'}`}>
        {/* Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          return (
            <header className={`px-7 h-14 sticky top-0 z-10 border-b backdrop-blur-sm flex items-center justify-between ${isDark ? 'bg-ink/85 border-line' : 'bg-white/90 border-gray-200'}`}>
              <div className="flex items-baseline gap-3 min-w-0">
                <h1 className={`font-display font-semibold text-[17px] truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentPage.name}</h1>
                <p className={`text-xs truncate hidden sm:block ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{currentPage.subtitle}</p>
              </div>
              <div className="flex items-center gap-4">
                {backgroundSync && (
                  <span className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {t('nav.checkingPending')}
                  </span>
                )}

                {/* Metrics */}
                <div className={`hidden md:flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <span>
                    {t('nav.attendances')}{' '}
                    <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardMetrics?.totalTranscriptions || '--'}</span>
                  </span>
                  <span className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <span>
                    {t('nav.conversion')}{' '}
                    <span className="font-mono font-medium text-[#F5A623]">{dashboardMetrics?.conversionRate || '--'}%</span>
                  </span>
                  <span className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <span className="hidden lg:block">
                    {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  title={isDark ? t('nav.lightTheme') : t('nav.darkTheme')}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Language */}
                <div className={`flex items-center rounded-md overflow-hidden border ${isDark ? 'border-line-strong' : 'border-gray-300'}`}>
                  <button onClick={() => switchLang('es')}
                    className={`px-2 py-1 text-[11px] font-semibold transition-colors ${lang === 'es' ? 'bg-[#F5A623] text-[#16120A]' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                    ES
                  </button>
                  <button onClick={() => switchLang('en')}
                    className={`px-2 py-1 text-[11px] font-semibold transition-colors ${lang === 'en' ? 'bg-[#F5A623] text-[#16120A]' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                    EN
                  </button>
                </div>

                {/* User & Logout */}
                <div className={`flex items-center gap-2`}>
                  <User className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <span className={`text-[13px] font-medium hidden sm:block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{user.username || t('nav.user')}</span>
                  <button
                    onClick={handleLogout}
                    className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-white/5' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                    title={t('nav.signOut')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>
          );
        })()}

        {/* Page content */}
        <div className="px-7 py-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
