import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';
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

interface PromotionBranch {
  branch: Branch;
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
  category: Category;
  branches: PromotionBranch[];
}

export default function EditPromotion() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] =
    useState<number[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [loadingPromotion, setLoadingPromotion] =
    useState(true);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!accessToken || !id) {
        return;
      }

      try {
        setError('');
        setLoadingPromotion(true);
        setLoadingCategories(true);
        setLoadingBranches(true);

        const [
          promotionsResponse,
          categoriesResponse,
          branchesResponse,
        ] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/api/promotions/me`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/api/categories`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/api/branches`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
        ]);

        const promotionsData: Promotion[] =
          await promotionsResponse.json();

        const categoriesData: Category[] =
          await categoriesResponse.json();

        const branchesData: Branch[] =
          await branchesResponse.json();

        if (!promotionsResponse.ok) {
          throw new Error(
            'No se pudo cargar la promoción.',
          );
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            'No se pudieron cargar las categorías.',
          );
        }

        if (!branchesResponse.ok) {
          throw new Error(
            'No se pudieron cargar las sucursales.',
          );
        }

        const promotion = promotionsData.find(
          (item) => item.id === Number(id),
        );

        if (!promotion) {
          throw new Error(
            'No se encontró la promoción solicitada.',
          );
        }

        const activeBranches = branchesData.filter(
          (branch) => branch.status,
        );

        const currentBranchIds =
          promotion.branches?.map(
            (item) => item.branch.id,
          ) ?? [];

        setTitle(promotion.title);
        setDescription(promotion.description ?? '');

        setOriginalPrice(
          String(promotion.originalPrice),
        );

        setDiscountPrice(
          String(promotion.discountPrice),
        );

        setStartDate(
          promotion.startDate.slice(0, 10),
        );

        setEndDate(
          promotion.endDate.slice(0, 10),
        );

        setCategoryId(
          String(promotion.category.id),
        );

        setImageUrl(promotion.image ?? '');
        setImagePreview(promotion.image ?? '');

        setCategories(categoriesData);
        setBranches(activeBranches);
        setSelectedBranchIds(currentBranchIds);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar la promoción.',
        );
      } finally {
        setLoadingPromotion(false);
        setLoadingCategories(false);
        setLoadingBranches(false);
      }
    }

    loadData();
  }, [accessToken, id]);

  function toggleBranch(branchId: number) {
    setSelectedBranchIds((current) => {
      if (current.includes(branchId)) {
        return current.filter(
          (selectedId) => selectedId !== branchId,
        );
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

    setError('');

    if (!file.type.startsWith('image/')) {
      setError(
        'El archivo seleccionado debe ser una imagen.',
      );

      event.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        'La imagen no puede superar los 5 MB.',
      );

      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);

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
    } catch (error) {
      setImagePreview(imageUrl);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo subir la imagen.',
      );
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    const original = Number(originalPrice);
    const discount = Number(discountPrice);

    if (discount > original) {
      setError(
        'El precio promocional no puede ser mayor al precio original.',
      );
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError(
        'La fecha de inicio debe ser anterior a la fecha de finalización.',
      );
      return;
    }

    if (selectedBranchIds.length === 0) {
      setError(
        'Debes seleccionar al menos una sucursal.',
      );
      return;
    }

    if (!accessToken) {
      setError('No hay una sesión activa.');
      return;
    }

    if (!id) {
      setError(
        'No se encontró el identificador de la promoción.',
      );
      return;
    }

    if (uploadingImage) {
      setError(
        'Espera a que termine de subir la imagen.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/promotions/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title,
            description,
            image: imageUrl || undefined,
            originalPrice: original,
            discountPrice: discount,
            startDate,
            endDate,
            categoryId: Number(categoryId),
            branchIds: selectedBranchIds,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo actualizar la promoción.',
        );
      }

      navigate('/negocio/promociones');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar la promoción.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (loadingPromotion) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Cargando promoción...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate('/negocio/promociones')
          }
          className="mb-4 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          ← Volver a mis promociones
        </button>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Editar promoción
        </h1>

        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Actualiza la información de tu promoción.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Título
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Descripción
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Imagen de la promoción
            </label>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Vista previa de la promoción"
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-slate-400">
                    No hay una imagen seleccionada.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage || loading}
                className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="mt-2">
              {uploadingImage ? (
                <p className="text-xs font-medium text-blue-600">
                  Subiendo imagen...
                </p>
              ) : imageUrl ? (
                <p className="text-xs font-medium text-green-600">
                  Imagen lista para guardar.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Puedes conservar la imagen actual o seleccionar una nueva.
                </p>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Formatos de imagen permitidos. Tamaño máximo: 5 MB.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="originalPrice"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Precio original
              </label>

              <input
                id="originalPrice"
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(event) =>
                  setOriginalPrice(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="discountPrice"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Precio promocional
              </label>

              <input
                id="discountPrice"
                type="number"
                min="0"
                step="0.01"
                value={discountPrice}
                onChange={(event) =>
                  setDiscountPrice(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Fecha de inicio
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Categoría
            </label>

            <select
              id="category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              disabled={loadingCategories}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-800">
                Disponible en
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Selecciona las sucursales donde estará disponible esta promoción.
              </p>
            </div>

            {loadingBranches ? (
              <p className="text-sm text-slate-500">
                Cargando sucursales...
              </p>
            ) : branches.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  No tienes sucursales activas disponibles.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/negocio/mi-negocio')
                  }
                  className="mt-2 text-sm font-semibold text-amber-900 underline underline-offset-2"
                >
                  Administrar sucursales
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {branches.map((branch) => {
                  const selected =
                    selectedBranchIds.includes(branch.id);

                  return (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleBranch(branch.id)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {branch.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {branch.address}
                          {branch.city
                            ? `, ${branch.city}`
                            : ''}
                        </p>

                        {branch.phone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {branch.phone}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {branches.length > 0 && (
              <p className="mt-3 text-xs font-medium text-slate-500">
                {selectedBranchIds.length}{' '}
                {selectedBranchIds.length === 1
                  ? 'sucursal seleccionada'
                  : 'sucursales seleccionadas'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate('/negocio/promociones')
            }
            disabled={loading}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              uploadingImage ||
              loadingBranches ||
              branches.length === 0 ||
              selectedBranchIds.length === 0
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadingImage
              ? 'Subiendo imagen...'
              : loading
                ? 'Guardando...'
                : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}