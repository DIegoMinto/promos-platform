import { useEffect, useState } from 'react';

import { useAuth } from '../context/useAuth';

interface Business {
  id: number;
  name: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'CLIENTE' | 'NEGOCIO' | 'ADMIN';
  status: boolean;
  createdAt: string;
  updatedAt: string;
  business: Business | null;
}

export default function AdminUsers() {
  const { user, accessToken } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');

useEffect(() => {
  if (!accessToken) {
    return;
  }

  let cancelled = false;

  async function fetchUsers() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudieron cargar los usuarios.',
        );
      }

      const data = await response.json();

      if (!cancelled) {
        setUsers(data);
      }
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los usuarios.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchUsers();

  return () => {
    cancelled = true;
  };
}, [accessToken]);

  async function handleStatusChange(
    targetUser: AdminUser,
  ) {
    if (!accessToken) {
      return;
    }

    const newStatus = !targetUser.status;

    setUpdatingUserId(targetUser.id);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${targetUser.id}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'No se pudo actualizar el estado.',
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === targetUser.id
            ? {
                ...currentUser,
                status: data.status,
              }
            : currentUser,
        ),
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado.',
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  function getRoleLabel(role: AdminUser['role']) {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';

      case 'NEGOCIO':
        return 'Negocio';

      case 'CLIENTE':
        return 'Cliente';

      default:
        return role;
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
            Cargando usuarios...
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
            Usuarios
          </h1>

          <p className="mt-2 text-slate-600">
            Gestiona los usuarios registrados en la plataforma.
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
            {users.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Usuario
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rol
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Negocio
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
                {users.map((item) => {
                  const isCurrentUser =
                    item.id === user?.id;

                  const isUpdating =
                    updatingUserId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          {getRoleLabel(item.role)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {item.business ? (
                          <div>
                            <p className="font-medium text-slate-800">
                              {item.business.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID #{item.business.id}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {item.status ? (
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
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs text-slate-400">
                            Cuenta actual
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleStatusChange(item)
                            }
                            className={
                              item.status
                                ? 'rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
                                : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                            }
                          >
                            {isUpdating
                              ? 'Actualizando...'
                              : item.status
                                ? 'Desactivar'
                                : 'Activar'}
                          </button>
                        )}
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