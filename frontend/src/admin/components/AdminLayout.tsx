import {
  Menu,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    }

    handleResize();

    window.addEventListener(
      'resize',
      handleResize,
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() =>
            setCollapsed(!collapsed)
          }
        />
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden ${
          mobileOpen
            ? 'block'
            : 'hidden'
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-40 w-64">
          <AdminSidebar
            collapsed={false}
            onToggle={() =>
              setMobileOpen(false)
            }
          />
        </div>
      </div>

      {/* Main */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed
            ? 'lg:ml-20'
            : 'lg:ml-64'
        }`}
      >
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileOpen(!mobileOpen)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            aria-label={
              mobileOpen
                ? 'Cerrar menú'
                : 'Abrir menú'
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

          <div className="ml-3">
            <p className="text-sm font-bold text-slate-900">
              PROMOS
            </p>

            <p className="text-[9px] font-semibold tracking-[0.18em] text-emerald-600">
              PLATFORM
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}