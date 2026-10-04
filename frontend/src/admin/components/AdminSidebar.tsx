import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

import { useAuth } from '../../context/useAuth';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: BarChart3,
  },
  {
    label: 'Usuarios',
    path: '/admin/usuarios',
    icon: Users,
  },
  {
    label: 'Negocios',
    path: '/admin/negocios',
    icon: Building2,
  },
  {
    label: 'Promociones',
    path: '/admin/promociones',
    icon: Megaphone,
  },
  {
    label: 'Categorías',
    path: '/admin/categorias',
    icon: Tags,
  },
];

export default function AdminSidebar({
  collapsed,
  onToggle,
}: AdminSidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex h-20 shrink-0 items-center border-b border-slate-100 ${
          collapsed
            ? 'justify-center px-3'
            : 'justify-between px-5'
        }`}
      >
        {!collapsed && (
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              PROMOS
            </p>

            <p className="text-xs font-medium tracking-[0.18em] text-emerald-600">
              PLATFORM
            </p>
          </div>
        )}

        {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ShieldCheck
              size={21}
              className="text-white"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Administración
          </p>
        )}

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
                className={({ isActive }) =>
                  `group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition ${
                    collapsed
                      ? 'justify-center'
                      : 'gap-3'
                  } ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={19} />

                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed && (
          <div className="mb-2 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase() || 'A'}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || 'Administrador'}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          title={
            collapsed
              ? 'Cerrar sesión'
              : undefined
          }
          className={`flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 ${
            collapsed
              ? 'justify-center'
              : 'gap-3'
          }`}
        >
          <LogOut size={19} />

          {!collapsed && (
            <span>Cerrar sesión</span>
          )}
        </button>
      </div>

      {/* Collapse button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-24 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        aria-label={
          collapsed
            ? 'Expandir menú'
            : 'Contraer menú'
        }
      >
        {collapsed ? (
          <ChevronRight size={15} />
        ) : (
          <ChevronLeft size={15} />
        )}
      </button>

      {/* Settings placeholder */}
      <div className="hidden">
        <Settings />
      </div>
    </aside>
  );
}