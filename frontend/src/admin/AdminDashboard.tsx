import { useEffect, useState } from 'react';

import { useAuth } from '../context/useAuth';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };

  businesses: {
    total: number;
    active: number;
    inactive: number;
  };

  promotions: {
    total: number;
    active: number;
    inactive: number;
  };

  categories: {
    total: number;
    active: number;
    inactive: number;
  };
}

export default function AdminDashboard() {
  const { accessToken, user } = useAuth();

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

useEffect(() => {
  if (!accessToken || !user) {
    return;
  }

  let cancelled = false;

  async function fetchDashboard() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudieron cargar las estadísticas.',
        );
      }

      const data = await response.json();

      if (!cancelled) {
        setStats(data);
      }
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las estadísticas.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchDashboard();

  return () => {
    cancelled = true;
  };
}, [accessToken, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-500">
              Cargando panel administrativo...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8">
            <h1 className="text-lg font-semibold text-slate-900">
              Error
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'Usuarios',
      total: stats.users.total,
      active: stats.users.active,
      inactive: stats.users.inactive,
      label: 'usuarios registrados',
    },
    {
      title: 'Negocios',
      total: stats.businesses.total,
      active: stats.businesses.active,
      inactive: stats.businesses.inactive,
      label: 'negocios registrados',
    },
    {
      title: 'Promociones',
      total: stats.promotions.total,
      active: stats.promotions.active,
      inactive: stats.promotions.inactive,
      label: 'promociones registradas',
    },
    {
      title: 'Categorías',
      total: stats.categories.total,
      active: stats.categories.active,
      inactive: stats.categories.inactive,
      label: 'categorías registradas',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Panel administrativo
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Resumen general de Promos Platform.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {card.total}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {card.label}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Activos
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {card.active}
                  </p>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div>
                  <p className="text-xs text-slate-400">
                    Inactivos
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {card.inactive}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Estado de la plataforma
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resumen de los registros activos e inactivos.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {cards.map((card) => {
              const percentage =
                card.total > 0
                  ? Math.round(
                      (card.active / card.total) * 100,
                    )
                  : 0;

              return (
                <div key={card.title}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {card.title}
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}