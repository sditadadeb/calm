import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  Settings,
  LogOut,
  User,
  UserPlus,
  Shield
} from 'lucide-react';

// Configuración de páginas con subtítulos
const pageConfig = {
  '/': { name: 'Dashboard Seguros', subtitle: 'Métricas de productores y asesores', icon: LayoutDashboard },
  '/transcriptions': { name: 'Interacciones', subtitle: 'Historial de atención al asegurado', icon: FileText },
  '/sellers': { name: 'Productores', subtitle: 'Rendimiento del equipo comercial', icon: Users },
  '/branches': { name: 'Zonas', subtitle: 'Performance por zona geográfica', icon: Building2 },
  '/users': { name: 'Usuarios', subtitle: 'Gestión de accesos', icon: UserPlus },
  '/settings': { name: 'Configuración', subtitle: 'Ajustes del sistema', icon: Settings },
};

// Navegación base (visible para todos)
const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Interacciones', href: '/transcriptions', icon: FileText },
  { name: 'Productores', href: '/sellers', icon: Users },
  { name: 'Zonas', href: '/branches', icon: Building2 },
];

// Navegación solo para ADMIN
const adminNavigation = [
  { name: 'Usuarios', href: '/users', icon: UserPlus },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

// Datos fake para el header
const FAKE_HEADER_METRICS = {
  polizasNuevas: 1847,
  tasaRetencion: 87.4
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1e3a5f]">Seguros Analytics</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Panel de Gestión Comercial</p>
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
              </>
            )}
          </div>
        </nav>

        {/* User Section at Bottom */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-4 h-4 text-[#1e3a5f]" />
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
            <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] px-8 py-5 sticky top-0 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
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
                      <p className="text-xs text-white/60">Pólizas Nuevas</p>
                      <p className="text-lg font-bold text-white">{FAKE_HEADER_METRICS.polizasNuevas.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60">Retención</p>
                      <p className="text-lg font-bold text-white">{FAKE_HEADER_METRICS.tasaRetencion}%</p>
                    </div>
                  </div>
                  <span className="text-sm text-white bg-white/15 px-4 py-2 rounded-full backdrop-blur-sm">
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
