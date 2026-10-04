import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';

import { useAuth } from '../context/useAuth';
import { categoryIcons } from '../constants/categoryIcons';

interface AdminCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    promotions: number;
  };
}

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
}

export default function AdminCategories() {
  const { accessToken } = useAuth();

  const [categories, setCategories] = useState<
    AdminCategory[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [updatingCategoryId, setUpdatingCategoryId] =
    useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [editingCategoryId, setEditingCategoryId] =
    useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CategoryForm>({
    name: '',
    description: '',
    icon: '',
  });
  
useEffect(() => {
  if (!accessToken) {
    return;
  }

  let cancelled = false;

  async function fetchCategories() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/categories`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudieron cargar las categorías.',
        );
      }

      const data = await response.json();

      if (!cancelled) {
        setCategories(data);
      }
    } catch (error) {
      console.error(error);

      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las categorías.',
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchCategories();

  return () => {
    cancelled = true;
  };
}, [accessToken]);

  function openCreateForm() {
    setEditingCategoryId(null);

    setForm({
      name: '',
      description: '',
      icon: '',
    });

    setError('');
    setSuccess('');

    setShowForm(true);
  }

  function openEditForm(
    category: AdminCategory,
  ) {
    setEditingCategoryId(category.id);

    setForm({
      name: category.name,
      description:
        category.description || '',
      icon: category.icon || '',
    });

    setError('');
    setSuccess('');

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCategoryId(null);
  }

  async function saveCategory(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        'El nombre de la categoría es obligatorio.',
      );

      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const isEditing =
        editingCategoryId !== null;

      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/api/admin/categories/${editingCategoryId}`
        : `${import.meta.env.VITE_API_URL}/api/admin/categories`;

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          name: form.name,
          description: form.description,
          icon: form.icon,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'No se pudo guardar la categoría.',
        );
      }

      if (isEditing) {
        setCategories((current) =>
          current.map((category) =>
            category.id === data.id
              ? data
              : category,
          ),
        );

        setSuccess(
          'Categoría actualizada correctamente.',
        );
      } else {
        setCategories((current) => [
          data,
          ...current,
        ]);

        setSuccess(
          'Categoría creada correctamente.',
        );
      }

      setShowForm(false);
      setEditingCategoryId(null);

      setForm({
        name: '',
        description: '',
        icon: '',
      });
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la categoría.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateCategoryStatus(
    categoryId: number,
    newStatus: boolean,
  ) {
    try {
      setUpdatingCategoryId(categoryId);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/categories/${categoryId}/status`,
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

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'No se pudo actualizar el estado.',
        );
      }

      setCategories((current) =>
        current.map((category) =>
          category.id === data.id
            ? {
                ...category,
                status: data.status,
              }
            : category,
        ),
      );

      setSuccess(
        newStatus
          ? 'Categoría activada correctamente.'
          : 'Categoría desactivada correctamente.',
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado.',
      );
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      'es-BO',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-600">
            Cargando categorías...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Administración
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Categorías
            </h1>

            <p className="mt-2 text-slate-600">
              Gestiona las categorías de promociones.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Nueva categoría
          </button>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MENSAJE DE ÉXITO */}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* FORMULARIO */}
        {showForm && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCategoryId
                    ? 'Editar categoría'
                    : 'Nueva categoría'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Completa los datos de la categoría.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            <form
              onSubmit={saveCategory}
              className="space-y-6"
            >
              {/* DATOS PRINCIPALES */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nombre
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Ej. Gastronomía"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Descripción
                  </label>

                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                    placeholder="Descripción opcional"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* SELECTOR DE ICONOS */}
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Icono
                  </label>

                  <p className="mt-1 text-xs text-slate-500">
                    Selecciona el icono que representará esta categoría.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {Object.entries(categoryIcons).map(
                    ([key, Icon]) => {
                      const selected =
                        form.icon === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              icon: key,
                            })
                          }
                          className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-2 transition ${
                            selected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={24} />

                          <span className="mt-2 text-center text-[10px] font-medium capitalize">
                            {key}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {!form.icon && (
                  <p className="mt-3 text-xs text-amber-600">
                    Puedes seleccionar un icono para representar la categoría.
                  </p>
                )}
              </div>

              {/* BOTONES */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando...'
                    : editingCategoryId
                      ? 'Guardar cambios'
                      : 'Crear categoría'}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RESUMEN */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Total
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {categories.length}
          </p>
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Descripción
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Promociones
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
                {categories.map((category) => {
                  const isUpdating =
                    updatingCategoryId === category.id;

                  const Icon =
                    categoryIcons[
                      category.icon || ''
                    ] || Tag;

                  return (
                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* CATEGORÍA */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Icon size={22} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {category.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID #{category.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPCIÓN */}
                      <td className="px-6 py-5">
                        {category.description ? (
                          <p className="max-w-sm text-sm text-slate-600">
                            {category.description}
                          </p>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* PROMOCIONES */}
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          {category._count.promotions}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="px-6 py-5">
                        {category.status ? (
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

                      {/* REGISTRO */}
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(
                          category.createdAt,
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(category)
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateCategoryStatus(
                                category.id,
                                !category.status,
                              )
                            }
                            className={
                              category.status
                                ? 'rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
                                : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
                            }
                          >
                            {isUpdating
                              ? 'Actualizando...'
                              : category.status
                                ? 'Desactivar'
                                : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No hay categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}