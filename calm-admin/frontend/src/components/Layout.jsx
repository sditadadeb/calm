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
  Moon
} from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';

// Configuración de páginas con subtítulos
const pageConfig = {
  '/': { name: 'Dashboard', subtitle: 'Análisis de Interacciones con IA', icon: LayoutDashboard },
  '/transcriptions': { name: 'Transcripciones', subtitle: 'Historial de conversaciones', icon: FileText },
  '/sellers': { name: 'Vendedores', subtitle: 'Rendimiento del equipo comercial', icon: Users },
  '/branches': { name: 'Sucursales', subtitle: 'Performance por punto de venta', icon: Building2 },
  '/recommendations': { name: 'Recomendaciones', subtitle: 'Insights y acciones de mejora', icon: Lightbulb },
  '/users': { name: 'Usuarios', subtitle: 'Gestión de accesos', icon: UserPlus },
  '/settings': { name: 'Configuración', subtitle: 'Ajustes del sistema', icon: Settings },
};

// Navegación base
const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transcripciones', href: '/transcriptions', icon: FileText },
  { name: 'Vendedores', href: '/sellers', icon: Users },
  { name: 'Sucursales', href: '/branches', icon: Building2 },
  { name: 'Recomendaciones', href: '/recommendations', icon: Lightbulb },
];

// Navegación solo para ADMIN
const adminNavigation = [
  { name: 'Usuarios', href: '/users', icon: UserPlus },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, fetchDashboardMetrics, fetchTranscriptions, dashboardMetrics } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ message: '', current: 0, total: 0, percent: 0, phase: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

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
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col border-r ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#F5A623]">
              <span className="text-white font-bold text-lg">calm</span>
            </div>
            <span className={`text-xl font-light ${isDark ? 'text-white' : 'text-gray-800'}`}>Admin</span>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Panel de Administración</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-4 px-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Menú
          </p>
          <div className="space-y-1">
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/30' 
                      : isDark 
                        ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            
            {isAdmin && (
              <>
                <div className={`border-t my-4 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}></div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Admin
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/30' 
                          : isDark 
                            ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Sync Button */}
                <div className="mt-4">
                  <button
                    onClick={handleSync}
                    disabled={syncing || loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white bg-gradient-to-r from-[#F5A623] to-[#FFBB54] hover:from-[#D4911F] hover:to-[#F5A623] transition-all duration-200 shadow-lg shadow-[#F5A623]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-sm">
                      {syncing 
                        ? (syncProgress.total > 0 
                            ? `${syncProgress.current}/${syncProgress.total}` 
                            : 'Conectando...')
                        : 'Sincronizar S3'}
                    </span>
                  </button>
                  {syncing && syncProgress.total > 0 && (
                    <div className="mt-3">
                      <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-gradient-to-r from-[#F5A623] to-[#FFBB54] h-2 rounded-full transition-all duration-300 ease-out"
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
      <main className={`flex-1 overflow-auto ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {/* Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          const PageIcon = currentPage.icon;
          return (
            <header className={`px-8 py-5 sticky top-0 z-10 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <PageIcon className="w-6 h-6 text-[#F5A623]" />
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentPage.name}</h1>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{currentPage.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Date */}
                  <span className={`hidden sm:block text-sm px-4 py-2 rounded-full ${isDark ? 'text-slate-300 bg-slate-700' : 'text-gray-600 bg-gray-100'}`}>
                    {new Date().toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  
                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Atenciones</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardMetrics?.totalTranscriptions || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Conversión</p>
                      <p className="text-2xl font-bold text-[#F5A623]">{dashboardMetrics?.conversionRate || '--'}%</p>
                    </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  {/* User & Logout */}
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <User className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium hidden sm:block ${isDark ? 'text-white' : 'text-gray-700'}`}>{user.username || 'Usuario'}</span>
                    <button
                      onClick={handleLogout}
                      className={`p-1.5 rounded transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-slate-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'}`}
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
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
