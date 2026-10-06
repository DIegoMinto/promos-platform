import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/useAuth';

interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  originalPrice: string | number;
  discountPrice: string | number;
  startDate: string;
  endDate: string;
  status: boolean;
  category: Category;
}

export default function MyPromotions() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );
  const [promotionToDelete, setPromotionToDelete] =
    useState<Promotion | null>(null);

  useEffect(() => {
    async function loadPromotions() {
      if (!accessToken) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/promotions/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar las promociones',
          );
        }

        const data: Promotion[] = await response.json();

        setPromotions(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar las promociones',
        );
      } finally {
        setLoading(false);
      }
    }

    loadPromotions();
  }, [accessToken]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  }

  async function handleDelete(promotion: Promotion) {
    if (!accessToken) {
      setError('No hay una sesión activa.');
      return;
    }

    try {
      setDeletingId(promotion.id);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/promotions/${promotion.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo eliminar la promoción',
        );
      }

      setPromotions((currentPromotions) =>
        currentPromotions.filter(
          (item) => item.id !== promotion.id,
        ),
      );

      setPromotionToDelete(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la promoción',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Mis promociones
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Administra las promociones de tu negocio.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/negocio/promociones/nueva')
            }
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            Nueva promoción
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Cargando promociones...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          promotions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Aún no tienes promociones
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Crea tu primera promoción para comenzar.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate('/negocio/promociones/nueva')
                }
                className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Crear promoción
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          promotions.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-2">
              {promotions.map((promotion) => (
                <article
                  key={promotion.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {promotion.image ? (
                    <img
                      src={promotion.image}
                      alt={promotion.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-12 w-12 text-slate-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 4.5-4.5a2.25 2.25 0 0 1 3.182 0l1.318 1.318m0 0 1.5-1.5a2.25 2.25 0 0 1 3.182 0l5.818 5.818M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
                        {promotion.category.name}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          promotion.status
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {promotion.status
                          ? 'Activa'
                          : 'Inactiva'}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {promotion.title}
                    </h2>

                    {promotion.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {promotion.description}
                      </p>
                    )}

                    <div className="mt-5 flex items-end gap-3">
                      <span className="text-2xl font-bold text-accent">
                        Bs.{' '}
                        {Number(
                          promotion.discountPrice,
                        ).toFixed(2)}
                      </span>

                      <span className="pb-0.5 text-sm text-slate-400 line-through">
                        Bs.{' '}
                        {Number(
                          promotion.originalPrice,
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Vigencia
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(
                          promotion.startDate,
                        )}{' '}
                        —{' '}
                        {formatDate(
                          promotion.endDate,
                        )}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/negocio/promociones/${promotion.id}/editar`,
                          )
                        }
                        className="rounded-xl border border-primary-light px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPromotionToDelete(
                            promotion,
                          )
                        }
                        disabled={
                          deletingId === promotion.id
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === promotion.id
                          ? 'Eliminando...'
                          : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>

      {promotionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-promotion-title"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
                <svg
                  className="h-6 w-6 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.82A2 2 0 004.63 19.7h14.74a2 2 0 001.73-3.02L13.7 3.86a2 2 0 00-3.41 0z"
                  />
                </svg>
              </div>

              <div>
                <h2
                  id="delete-promotion-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Eliminar promoción
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  ¿Estás seguro de que quieres eliminar{' '}
                  <span className="font-semibold text-slate-900">
                    "{promotionToDelete.title}"
                  </span>
                  ?
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setPromotionToDelete(null)
                }
                disabled={deletingId !== null}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(promotionToDelete)
                }
                disabled={deletingId !== null}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId !== null
                  ? 'Eliminando...'
                  : 'Eliminar promoción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}