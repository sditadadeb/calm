import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Send, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/surveys', icon: ClipboardList, label: 'Encuestas' },
  { to: '/contacts', icon: Users, label: 'Contactos' },
  { to: '/distributions', icon: Send, label: 'Distribuciones' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 glass-dark transform transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg text-white">Numia</h1>
                  <p className="text-xs text-white/50">Surveys</p>
                </div>
              </div>
              <button 
                className="lg:hidden text-white/50 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600/30 to-primary-500/20 text-white border border-primary-500/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-white/50 truncate">{user?.companyName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="glass-dark border-b border-white/10 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

