import { useEffect, useState } from 'react';

import { useAuth } from '../context/useAuth';

interface BusinessOwner {
  id: number;
  name: string;
  email: string;
  status: boolean;
}

interface AdminBusiness {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  user: BusinessOwner;
}

export default function AdminBusinesses() {
  const { accessToken } = useAuth();

  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBusinessId, setUpdatingBusinessId] =
    useState<number | null>(null);
  const [error, setError] = useState('');

useEffect(() => {
  if (!accessToken) {
    return;
  }

  let cancelled = false;

  async function fetchBusinesses() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/businesses`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudieron cargar los negocios.',
        );
      }

      const data = await response.json();

      if (!cancelled) {
        setBusinesses(data);
      }
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los negocios.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchBusinesses();

  return () => {
    cancelled = true;
  };
}, [accessToken]);

  async function updateBusinessStatus(
    businessId: number,
    newStatus: boolean,
  ) {
    try {
      setUpdatingBusinessId(businessId);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/businesses/${businessId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message ||
            'No se pudo actualizar el estado del negocio.',
        );
      }

      const updatedBusiness = await response.json();

      setBusinesses((currentBusinesses) =>
        currentBusinesses.map((business) =>
          business.id === updatedBusiness.id
            ? {
                ...business,
                status: updatedBusiness.status,
              }
            : business,
        ),
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del negocio.',
      );
    } finally {
      setUpdatingBusinessId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">
            Cargando negocios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Negocios
          </h1>

          <p className="mt-2 text-slate-600">
            Gestiona los negocios registrados en la plataforma.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Total
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {businesses.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Negocio
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Propietario
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contacto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ubicación
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registro
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {businesses.map((business) => {
                  const isUpdating =
                    updatingBusinessId === business.id;

                  return (
                    <tr
                      key={business.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {business.logo ? (
                            <img
                              src={business.logo}
                              alt={business.name}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
                              {business.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-900">
                              {business.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID #{business.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="font-medium text-slate-800">
                            {business.user.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {business.user.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {business.phone ? (
                          <span className="text-sm text-slate-700">
                            {business.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          {business.city && (
                            <p className="font-medium text-slate-800">
                              {business.city}
                            </p>
                          )}

                          {business.address && (
                            <p className="mt-1 max-w-xs text-sm text-slate-500">
                              {business.address}
                            </p>
                          )}

                          {!business.city &&
                            !business.address && (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {business.status ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(business.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateBusinessStatus(
                              business.id,
                              !business.status,
                            )
                          }
                          className={
                            business.status
                              ? 'rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
                              : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                          }
                        >
                          {isUpdating
                            ? 'Actualizando...'
                            : business.status
                              ? 'Desactivar'
                              : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}