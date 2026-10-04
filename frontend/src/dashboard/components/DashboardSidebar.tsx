import { useState } from 'react';
import {
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../../context/useAuth';

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
    </svg>
  );
}

function PromotionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
      />

      <path
        strokeLinecap="round"
        d="M4 8h16"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h4"
      />
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M5.25 21V8.25L12 4l6.75 4.25V21M8.25 21v-5.25h7.5V21M8.25 10.5h.01M12 10.5h.01M15.75 10.5h.01"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 20a7 7 0 0 1 14 0"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 8l4 4-4 4"
      />

      <path
        strokeLinecap="round"
        d="M10 12h8"
      />
    </svg>
  );
}

export default function DashboardSidebar({
  user,
}: DashboardSidebarProps) {
  const { logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] =
    useState(false);

  function handleNavigation(path: string) {
    navigate(path);
    setIsMobileOpen(false);
  }

  function isActive(path: string) {
    if (path === '/negocio') {
      return location.pathname === '/negocio';
    }

    return location.pathname.startsWith(path);
  }

  return (
    <>
      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
        {/* Brand */}

        <div className="border-b border-slate-200 px-6 py-6">
          <div className="text-2xl font-black tracking-tight text-blue-700">
            Promos
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Panel de negocio
          </p>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 p-4">
          <button
            type="button"
            onClick={() =>
              handleNavigation('/negocio')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isActive('/negocio')
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <DashboardIcon />

            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                '/negocio/promociones',
              )
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isActive('/negocio/promociones')
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <PromotionIcon />

            <span>Promociones</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                '/negocio/mi-negocio',
              )
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isActive('/negocio/mi-negocio')
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <BusinessIcon />

            <span>Mi negocio</span>
          </button>
        </nav>

        {/* User */}

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <UserIcon />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogoutIcon />

            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* =========================
          MOBILE HEADER
      ========================== */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() =>
            setIsMobileOpen(true)
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>

        <div className="text-xl font-black tracking-tight text-blue-700">
          Promos
        </div>

        <div className="h-10 w-10" />
      </header>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setIsMobileOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}

      {/* =========================
          MOBILE SIDEBAR
      ========================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,320px)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        {/* Mobile brand */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <div className="text-2xl font-black tracking-tight text-blue-700">
              Promos
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Panel de negocio
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsMobileOpen(false)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mobile navigation */}

        <nav className="flex-1 space-y-1 p-4">
          <button
            type="button"
            onClick={() =>
              handleNavigation('/negocio')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
              isActive('/negocio')
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <DashboardIcon />

            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                '/negocio/promociones',
              )
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
              isActive('/negocio/promociones')
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <PromotionIcon />

            <span>Promociones</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                '/negocio/mi-negocio',
              )
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
              isActive('/negocio/mi-negocio')
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <BusinessIcon />

            <span>Mi negocio</span>
          </button>
        </nav>

        {/* Mobile user */}

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <UserIcon />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogoutIcon />

            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}