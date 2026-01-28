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
  Lightbulb
} from 'lucide-react';
import useStore from '../store/useStore';
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

// Navegación base (visible para todos)
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
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ message: '', current: 0, total: 0, percent: 0, phase: '' });

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  // Load metrics for header on mount
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
        
        // Track progress for final message
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
      
      // Check if it was a normal close or an error
      if (eventSource.readyState === EventSource.CLOSED) {
        // Normal close - refresh data
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
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#FF8C00]">calm</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Panel de Administración</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Menú
          </p>
          <div className="space-y-1">
            {/* Navegación base - visible para todos */}
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Navegación solo para ADMIN */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-100 my-3"></div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  Admin
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Sync Button - Solo para ADMIN */}
                <div className="mt-2">
                  <button
                    onClick={handleSync}
                    disabled={syncing || loading}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-gradient-to-r from-[#FF8C00] to-[#FFB347] hover:from-[#e07b00] hover:to-[#FF8C00] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#FF8C00] h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${syncProgress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate" title={syncProgress.message}>
                        {syncProgress.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* User Section at Bottom */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#fff8eb] flex items-center justify-center">
                <User className="w-4 h-4 text-[#FF8C00]" />
              </div>
              <span className="font-medium">{user.username || 'Usuario'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Unified Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          const PageIcon = currentPage.icon;
          return (
            <header className="bg-gradient-to-r from-[#f5a623] to-[#e6951a] px-8 py-5 sticky top-0 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <PageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{currentPage.name}</h1>
                    <p className="text-sm text-white/70">{currentPage.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-white/60">Atenciones</p>
                      <p className="text-lg font-bold text-white">{dashboardMetrics?.totalTranscriptions || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60">Conversión</p>
                      <p className="text-lg font-bold text-white">{dashboardMetrics?.conversionRate || '--'}%</p>
                    </div>
                  </div>
                  <span className="text-sm text-white bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    {new Date().toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
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
