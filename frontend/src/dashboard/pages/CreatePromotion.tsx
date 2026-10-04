import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/useAuth';

interface Category {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  status: boolean;
}

export default function CreatePromotion() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [categories, setCategories] = useState<Category[]>(
    [],
  );

  const [branches, setBranches] = useState<Branch[]>(
    [],
  );

  const [selectedBranchIds, setSelectedBranchIds] =
    useState<number[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState('');

  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    originalPrice: '',
    discountPrice: '',
    startDate: '',
    endDate: '',
    categoryId: '',
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/categories`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudieron cargar las categorías.',
          );
        }

        setCategories(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las categorías.',
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    if (accessToken) {
      loadCategories();
    }
  }, [accessToken]);

  useEffect(() => {
    async function loadBranches() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/branches`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudieron cargar las sucursales.',
          );
        }

        const activeBranches = data.filter(
          (branch: Branch) => branch.status,
        );

        setBranches(activeBranches);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las sucursales.',
        );
      } finally {
        setLoadingBranches(false);
      }
    }

    if (accessToken) {
      loadBranches();
    }
  }, [accessToken]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleBranch(branchId: number) {
    setSelectedBranchIds((current) => {
      if (current.includes(branchId)) {
        return current.filter((id) => id !== branchId);
      }

      return [...current, branchId];
    });
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('El archivo seleccionado debe ser una imagen.');
      event.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError('La imagen no puede superar los 5 MB.');
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
    setImageUrl('');

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append('image', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/promotions/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo subir la imagen.',
        );
      }

      setImageUrl(data.url);
    } catch (err) {
      setImagePreview('');
      setImageUrl('');

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo subir la imagen.',
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage() {
    setImagePreview('');
    setImageUrl('');
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    const originalPrice = Number(form.originalPrice);
    const discountPrice = Number(form.discountPrice);

    if (selectedBranchIds.length === 0) {
      setError(
        'Debes seleccionar al menos una sucursal.',
      );
      return;
    }

    if (discountPrice > originalPrice) {
      setError(
        'El precio promocional no puede ser mayor al precio original.',
      );
      return;
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError(
        'La fecha de inicio debe ser anterior a la fecha de finalización.',
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/promotions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          image: imageUrl || undefined,
          originalPrice,
          discountPrice,
          startDate: new Date(
            form.startDate,
          ).toISOString(),
          endDate: new Date(
            form.endDate,
          ).toISOString(),
          categoryId: Number(form.categoryId),
          branchIds: selectedBranchIds,
        }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo crear la promoción.',
        );
      }

      navigate('/negocio/promociones');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear la promoción.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/negocio/promociones')}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 12H5M12 19l-7-7 7-7"
            />
          </svg>

          Volver a promociones
        </button>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Nueva promoción
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Crea una nueva oferta para tus clientes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {/* Información */}
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Información de la promoción
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Los datos que verán los clientes.
          </p>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Título
          </label>

          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej. 2x1 en hamburguesas"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Descripción
          </label>

          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe brevemente tu promoción..."
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Image */}
        <div>
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">
              Imagen de la promoción
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Agrega una imagen atractiva para mostrar tu promoción.
            </p>
          </div>

          {imagePreview ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="relative aspect-video w-full">
                <img
                  src={imagePreview}
                  alt="Vista previa de la promoción"
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  disabled={uploadingImage}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Quitar imagen"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>

                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                    <div className="rounded-xl bg-white px-4 py-3 shadow-lg">
                      <p className="text-sm font-semibold text-slate-700">
                        Subiendo imagen...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  {uploadingImage ? (
                    <p className="text-sm font-medium text-slate-600">
                      Subiendo a Cloudinary...
                    </p>
                  ) : imageUrl ? (
                    <div className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5 shrink-0 text-green-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>

                      <p className="text-sm font-medium text-green-700">
                        Imagen subida correctamente
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Preparando imagen...
                    </p>
                  )}
                </div>

                <label className="shrink-0 cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-800">
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15V4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7.5 8.5 4.5-4.5 4.5 4.5"
                  />
                </svg>
              </div>

              <p className="text-sm font-semibold text-slate-700">
                Selecciona una imagen
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG, WEBP · Máximo 5 MB
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Categoría
          </label>

          <select
            id="categoryId"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
            disabled={loadingCategories}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          >
            <option value="">
              {loadingCategories
                ? 'Cargando categorías...'
                : 'Selecciona una categoría'}
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branches */}
        <div>
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">
              Disponible en
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona las sucursales donde estará disponible esta promoción.
            </p>
          </div>

          {loadingBranches ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">
                Cargando sucursales...
              </p>
            </div>
          ) : branches.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-800">
                No tienes sucursales activas disponibles.
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Crea o activa una sucursal desde Mi negocio antes de crear una promoción.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => {
                const selected = selectedBranchIds.includes(
                  branch.id,
                );

                return (
                  <label
                    key={branch.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      selected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleBranch(branch.id)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {branch.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {branch.address}
                        {branch.city
                          ? `, ${branch.city}`
                          : ''}
                      </p>

                      {branch.phone && (
                        <p className="mt-1 text-xs text-slate-400">
                          {branch.phone}
                        </p>
                      )}
                    </div>

                    {selected && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {selectedBranchIds.length > 0 && (
            <p className="mt-3 text-xs font-medium text-blue-700">
              {selectedBranchIds.length === 1
                ? '1 sucursal seleccionada'
                : `${selectedBranchIds.length} sucursales seleccionadas`}
            </p>
          )}
        </div>

        {/* Prices */}
        <div>
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Precios
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="originalPrice"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Precio original
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  Bs.
                </span>

                <input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={handleChange}
                  placeholder="50.00"
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="discountPrice"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Precio promocional
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-500">
                  Bs.
                </span>

                <input
                  id="discountPrice"
                  name="discountPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={handleChange}
                  placeholder="35.00"
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Vigencia
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Fecha de inicio
              </label>

              <input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Fecha de finalización
              </label>

              <input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/negocio/promociones')}
            disabled={submitting || uploadingImage}
            className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              uploadingImage ||
              loadingBranches ||
              branches.length === 0
            }
            className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting
              ? 'Creando...'
              : 'Crear promoción'}
          </button>
        </div>
      </form>
    </section>
  );
}