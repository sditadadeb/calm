import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  RefreshCw,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import useStore from '../store/useStore';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transcripciones', href: '/transcriptions', icon: FileText },
  { name: 'Vendedores', href: '/sellers', icon: Users },
  { name: 'Sucursales', href: '/branches', icon: Building2 },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { syncFromS3, loading } = useStore();
  const [syncing, setSyncing] = useState(false);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncFromS3();
      alert(`✓ Sincronización completada\nNuevas transcripciones: ${result.imported}\nAnalizadas: ${result.analyzed || 0}`);
    } catch (error) {
      alert('Error al sincronizar: ' + error.message);
    } finally {
      setSyncing(false);
    }
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
            {navigation.map((item) => {
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
            
            {/* Sync Button - Same style as nav items but with special color */}
            <button
              onClick={handleSync}
              disabled={syncing || loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-gradient-to-r from-[#FF8C00] to-[#FFB347] hover:from-[#e07b00] hover:to-[#FF8C00] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="font-medium">{syncing ? 'Sincronizando...' : 'Sincronizar S3'}</span>
            </button>
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
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2d2d2d]">
                {navigation.find(n => n.href === location.pathname)?.name || 'Panel'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 bg-[#fff8eb] px-4 py-2 rounded-full">
                {new Date().toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
