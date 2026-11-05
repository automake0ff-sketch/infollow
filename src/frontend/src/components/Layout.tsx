import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LucideIcon, LayoutDashboard, Users, Building2, ClipboardList, Calendar, Bot, MessageSquare, BarChart3, Settings, LogOut } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Clientes', icon: Users },
  { to: '/properties', label: 'Propiedades', icon: Building2 },
  { to: '/tasks', label: 'Tareas', icon: ClipboardList },
  { to: '/visits', label: 'Visitas', icon: Calendar },
  { to: '/assistant', label: 'Copiloto IA', icon: Bot },
  { to: '/messages', label: 'Mensajes IA', icon: MessageSquare },
  { to: '/conversation-analyzer', label: 'Analizador', icon: BarChart3 },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
              <span className="text-brand-600">INMO FOLLOW AI</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 hidden md:block">
                {user?.agencyId ? `Agencia: ${user.agencyId.slice(0, 8)}` : ''}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile sidebar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="grid grid-cols-6 h-14">
            {navItems.slice(0, 6).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-center text-gray-500 hover:text-brand-600 ${
                  location.pathname === item.to ? 'text-brand-600' : ''
                }`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col">
          <div className="flex-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 ${
                  location.pathname === item.to
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-full"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 md:ml-60 pb-20 md:pb-0 min-h-[calc(100vh-64px)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
