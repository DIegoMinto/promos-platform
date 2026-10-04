import { useEffect, useState } from 'react';

import { useAuth } from '../context/useAuth';

interface PromotionBranch {
  branch: {
    id: number;
    name: string;
    address: string;
    city: string | null;
    status: boolean;
  };
}

interface AdminPromotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  originalPrice: string | number;
  discountPrice: string | number;
  startDate: string;
  endDate: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;

  business: {
    id: number;
    name: string;
    status: boolean;
  };

  category: {
    id: number;
    name: string;
    status: boolean;
  };

  branches: PromotionBranch[];
}

export default function AdminPromotions() {
  const { accessToken } = useAuth();

  const [promotions, setPromotions] = useState<
    AdminPromotion[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [updatingPromotionId, setUpdatingPromotionId] =
    useState<number | null>(null);

  const [error, setError] = useState('');

useEffect(() => {
  if (!accessToken) {
    return;
  }

  let cancelled = false;

  async function fetchPromotions() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/promotions`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudieron cargar las promociones.',
        );
      }

      const data = await response.json();

      if (!cancelled) {
        setPromotions(data);
      }
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las promociones.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchPromotions();

  return () => {
    cancelled = true;
  };
}, [accessToken]);

  async function updatePromotionStatus(
    promotionId: number,
    newStatus: boolean,
  ) {
    try {
      setUpdatingPromotionId(promotionId);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/promotions/${promotionId}/status`,
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
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            'No se pudo actualizar el estado de la promoción.',
        );
      }

      const updatedPromotion =
        await response.json();

      setPromotions((currentPromotions) =>
        currentPromotions.map((promotion) =>
          promotion.id === updatedPromotion.id
            ? {
                ...promotion,
                status: updatedPromotion.status,
              }
            : promotion,
        ),
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado de la promoción.',
      );
    } finally {
      setUpdatingPromotionId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatPrice(
    price: string | number,
  ) {
    return Number(price).toFixed(2);
  }

  function calculateDiscount(
    originalPrice: string | number,
    discountPrice: string | number,
  ) {
    const original = Number(originalPrice);
    const discount = Number(discountPrice);

    if (
      !original ||
      original <= 0 ||
      discount >= original
    ) {
      return 0;
    }

    return Math.round(
      ((original - discount) / original) * 100,
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">
            Cargando promociones...
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
            Promociones
          </h1>

          <p className="mt-2 text-slate-600">
            Gestiona las promociones registradas en la
            plataforma.
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
            {promotions.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Promoción
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Negocio
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Precio
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vigencia
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sucursales
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {promotions.map((promotion) => {
                  const isUpdating =
                    updatingPromotionId ===
                    promotion.id;

                  const discount =
                    calculateDiscount(
                      promotion.originalPrice,
                      promotion.discountPrice,
                    );

                  return (
                    <tr
                      key={promotion.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {promotion.image ? (
                            <img
                              src={promotion.image}
                              alt={promotion.title}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">
                              SIN
                            </div>
                          )}

                          <div className="max-w-xs">
                            <p className="font-semibold text-slate-900">
                              {promotion.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID #{promotion.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-800">
                          {promotion.business.name}
                        </p>

                        {!promotion.business.status && (
                          <p className="mt-1 text-xs text-red-500">
                            Negocio inactivo
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {promotion.category.name}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-400 line-through">
                          Bs.{' '}
                          {formatPrice(
                            promotion.originalPrice,
                          )}
                        </p>

                        <p className="font-semibold text-slate-900">
                          Bs.{' '}
                          {formatPrice(
                            promotion.discountPrice,
                          )}
                        </p>

                        {discount > 0 && (
                          <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            -{discount}%
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        <p>
                          {formatDate(
                            promotion.startDate,
                          )}
                        </p>

                        <p className="mt-1">
                          {formatDate(
                            promotion.endDate,
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        {promotion.branches.length > 0 ? (
                          <div className="space-y-1">
                            {promotion.branches.map(
                              ({ branch }) => (
                                <p
                                  key={branch.id}
                                  className="text-sm text-slate-700"
                                >
                                  {branch.name}
                                </p>
                              ),
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Sin sucursal
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {promotion.status ? (
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

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updatePromotionStatus(
                              promotion.id,
                              !promotion.status,
                            )
                          }
                          className={
                            promotion.status
                              ? 'rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
                              : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                          }
                        >
                          {isUpdating
                            ? 'Actualizando...'
                            : promotion.status
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