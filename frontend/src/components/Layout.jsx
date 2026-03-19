import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings,
  LogOut,
  User,
  UserPlus,
  Sun,
  Moon,
  Search,
  Lightbulb
} from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

// Configuración de páginas con subtítulos
const pageConfig = {
  '/': { name: 'Dashboard Comercial', subtitle: 'Inteligencia de conversaciones para ventas', icon: LayoutDashboard },
  '/transcriptions': { name: 'Conversaciones', subtitle: 'Base analizada para gestión comercial', icon: FileText },
  '/search': { name: 'Buscar', subtitle: 'Exploración comercial de conversaciones analizadas', icon: Search },
  '/sales-recommendations': { name: 'Recomendaciones', subtitle: 'Acciones para vender más y retener', icon: Lightbulb },
  '/users': { name: 'Usuarios', subtitle: 'Gestión de accesos', icon: UserPlus },
  '/settings': { name: 'Configuración', subtitle: 'Ajustes del sistema', icon: Settings },
};

// Navegación base
const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Conversaciones', href: '/transcriptions', icon: FileText },
  { name: 'Buscar', href: '/search', icon: Search },
  { name: 'Recomendaciones', href: '/sales-recommendations', icon: Lightbulb },
];

// Navegación solo para ADMIN
const adminNavigation = [
  { name: 'Usuarios', href: '/users', icon: UserPlus },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchDashboardMetrics, dashboardMetrics } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const brandLogo = isDark ? '/carrefour-banco-dark.png' : '/carrefour-banco-light.png';

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    if (!dashboardMetrics) {
      fetchDashboardMetrics();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };


  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col border-r ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="Carrefour Banco"
              className={`w-auto ${isDark ? 'h-20 rounded-md' : 'h-14'}`}
            />
            {!isDark && <span className="text-xl font-semibold text-gray-800">Admin</span>}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Banco de servicios financieros</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-4 px-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
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
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' 
                      : isDark 
                        ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
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
                <div className={`border-t my-4 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}></div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
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
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' 
                          : isDark 
                            ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
              </>
            )}
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Header */}
        {(() => {
          const currentPage = pageConfig[location.pathname] || { name: 'Panel', subtitle: '', icon: LayoutDashboard };
          const PageIcon = currentPage.icon;
          return (
            <header className={`px-8 py-5 sticky top-0 z-10 border-b ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100'}`}>
                    <PageIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentPage.name}</h1>
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{currentPage.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Date */}
                  <span className={`hidden sm:block text-sm px-4 py-2 rounded-full ${isDark ? 'text-zinc-300 bg-zinc-900 border border-zinc-800' : 'text-gray-600 bg-gray-100'}`}>
                    {new Date().toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  
                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Atenciones</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardMetrics?.totalTranscriptions || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Resolución</p>
                      <p className="text-2xl font-bold text-emerald-500">{dashboardMetrics?.conversionRate || '--'}%</p>
                    </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-zinc-900 text-yellow-300 border border-zinc-800 hover:bg-zinc-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  {/* User & Logout */}
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100'}`}>
                    <User className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium hidden sm:block ${isDark ? 'text-white' : 'text-gray-700'}`}>{user.username || 'Usuario'}</span>
                    <button
                      onClick={handleLogout}
                      className={`p-1.5 rounded transition-colors ${isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'}`}
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
