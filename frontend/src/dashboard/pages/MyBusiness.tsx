import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { useAuth } from '../../context/useAuth';

interface Business {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  phone: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Branch {
  id: number;
  businessId: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  status: boolean;
}

export default function MyBusiness() {
  const { accessToken } = useAuth();

  const [business, setBusiness] =
    useState<Business | null>(null);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [showBranchForm, setShowBranchForm] =
    useState(false);

  const [branchName, setBranchName] =
    useState('');
  const [branchAddress, setBranchAddress] =
    useState('');
  const [branchCity, setBranchCity] =
    useState('');
  const [branchPhone, setBranchPhone] =
    useState('');

  const [editingBranchId, setEditingBranchId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBranch, setCreatingBranch] =
    useState(false);
  const [updatingBranch, setUpdatingBranch] =
    useState(false);
  const [branchesLoading, setBranchesLoading] =
    useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [branchToToggle, setBranchToToggle] =
    useState<Branch | null>(null);

  const [togglingBranch, setTogglingBranch] =
    useState(false);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) {
        return;
      }

      try {
        setLoading(true);
        setBranchesLoading(true);
        setError('');

        const [businessResponse, branchesResponse] =
          await Promise.all([
            fetch(
              `${import.meta.env.VITE_API_URL}/api/businesses/me`,
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

        if (!businessResponse.ok) {
          throw new Error(
            'No se pudo cargar la información del negocio',
          );
        }

        if (!branchesResponse.ok) {
          throw new Error(
            'No se pudieron cargar las sucursales',
          );
        }

        const businessData: Business =
          await businessResponse.json();

        const branchesData: Branch[] =
          await branchesResponse.json();

        setBusiness(businessData);

        setName(businessData.name ?? '');
        setDescription(
          businessData.description ?? '',
        );
        setPhone(businessData.phone ?? '');
        setAddress(businessData.address ?? '');
        setCity(businessData.city ?? '');

        setBranches(branchesData);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar la información',
        );
      } finally {
        setLoading(false);
        setBranchesLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/businesses/me`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name,
            description,
            phone,
            address,
            city,
          }),
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            'No se pudo actualizar la información',
        );
      }

      const updatedBusiness: Business =
        await response.json();

      setBusiness(updatedBusiness);

      setName(updatedBusiness.name ?? '');
      setDescription(
        updatedBusiness.description ?? '',
      );
      setPhone(updatedBusiness.phone ?? '');
      setAddress(updatedBusiness.address ?? '');
      setCity(updatedBusiness.city ?? '');

      setSuccess(
        'La información del negocio se actualizó correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar el negocio',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBranch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      setCreatingBranch(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/branches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: branchName,
            address: branchAddress,
            city: branchCity || undefined,
            phone: branchPhone || undefined,
          }),
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            'No se pudo crear la sucursal',
        );
      }

      const newBranch: Branch =
        await response.json();

      setBranches((currentBranches) => [
        newBranch,
        ...currentBranches,
      ]);

      setBranchName('');
      setBranchAddress('');
      setBranchCity('');
      setBranchPhone('');

      setShowBranchForm(false);

      setSuccess(
        'La sucursal se creó correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear la sucursal',
      );
    } finally {
      setCreatingBranch(false);
    }
  }

  function startEditingBranch(branch: Branch) {
    setEditingBranchId(branch.id);

    setBranchName(branch.name);
    setBranchAddress(branch.address);
    setBranchCity(branch.city ?? '');
    setBranchPhone(branch.phone ?? '');

    setShowBranchForm(false);
    setError('');
    setSuccess('');

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }

  function cancelEditingBranch() {
    setEditingBranchId(null);

    setBranchName('');
    setBranchAddress('');
    setBranchCity('');
    setBranchPhone('');

    setError('');
  }

  async function handleUpdateBranch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken || editingBranchId === null) {
      return;
    }

    try {
      setUpdatingBranch(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/branches/${editingBranchId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: branchName,
            address: branchAddress,
            city: branchCity || undefined,
            phone: branchPhone || undefined,
          }),
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            'No se pudo actualizar la sucursal',
        );
      }

      const updatedBranch: Branch =
        await response.json();

      setBranches((currentBranches) =>
        currentBranches.map((branch) =>
          branch.id === updatedBranch.id
            ? updatedBranch
            : branch,
        ),
      );

      cancelEditingBranch();

      setSuccess(
        'La sucursal se actualizó correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar la sucursal',
      );
    } finally {
      setUpdatingBranch(false);
    }
  }

  async function handleToggleBranch() {
    if (!accessToken || !branchToToggle) {
      return;
    }

    try {
      setTogglingBranch(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        branchToToggle.status
          ? `${import.meta.env.VITE_API_URL}/api/branches/${branchToToggle.id}`
          : `${import.meta.env.VITE_API_URL}/api/branches/${branchToToggle.id}/restore`,
        {
          method: branchToToggle.status
            ? 'DELETE'
            : 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            `No se pudo ${
              branchToToggle.status
                ? 'desactivar'
                : 'activar'
            } la sucursal`,
        );
      }

      const updatedBranch: Branch =
        await response.json();

      setBranches((currentBranches) =>
        currentBranches.map((branch) =>
          branch.id === updatedBranch.id
            ? updatedBranch
            : branch,
        ),
      );

      setSuccess(
        branchToToggle.status
          ? 'La sucursal se desactivó correctamente.'
          : 'La sucursal se activó correctamente.',
      );

      setBranchToToggle(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar la sucursal',
      );
    } finally {
      setTogglingBranch(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">
            Configuración
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Mi negocio
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Cargando información...
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 space-y-4">
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Configuración
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Mi negocio
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Administra la información que verán los clientes.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Información visual */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-soft text-3xl font-black text-primary">
              {business?.name
                ? business.name
                    .charAt(0)
                    .toUpperCase()
                : 'N'}
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {business?.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información pública del negocio
            </p>
          </div>
        </div>

        {/* Información general */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Información general
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actualiza los datos principales de tu negocio.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="business-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nombre del negocio
              </label>

              <input
                id="business-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label
                htmlFor="business-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Descripción
              </label>

              <textarea
                id="business-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                placeholder="Describe brevemente tu negocio"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label
                htmlFor="business-phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Teléfono
              </label>

              <input
                id="business-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Ej. 70000000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label
                htmlFor="business-address"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Dirección
              </label>

              <input
                id="business-address"
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Ej. Calle Junín #123"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label
                htmlFor="business-city"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ciudad
              </label>

              <input
                id="business-city"
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="Ej. Sucre"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Sucursales */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Sucursales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Administra los lugares donde opera tu negocio.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowBranchForm((current) => !current)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>

            {showBranchForm
              ? 'Cerrar formulario'
              : 'Nueva sucursal'}
          </button>
        </div>

        {/* Crear sucursal */}
        {showBranchForm && (
          <form
            onSubmit={handleCreateBranch}
            className="mt-6 rounded-2xl border border-primary-light bg-primary-soft/50 p-5"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nueva sucursal
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Registra una ubicación donde tus clientes puedan encontrar tu negocio.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="branch-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nombre
                </label>

                <input
                  id="branch-name"
                  type="text"
                  value={branchName}
                  onChange={(event) =>
                    setBranchName(event.target.value)
                  }
                  placeholder="Ej. Sucursal San Roque"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label
                  htmlFor="branch-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Teléfono
                </label>

                <input
                  id="branch-phone"
                  type="tel"
                  value={branchPhone}
                  onChange={(event) =>
                    setBranchPhone(event.target.value)
                  }
                  placeholder="Ej. 70000000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="branch-address"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Dirección
                </label>

                <input
                  id="branch-address"
                  type="text"
                  value={branchAddress}
                  onChange={(event) =>
                    setBranchAddress(event.target.value)
                  }
                  placeholder="Ej. Calle Junín #456"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label
                  htmlFor="branch-city"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Ciudad
                </label>

                <input
                  id="branch-city"
                  type="text"
                  value={branchCity}
                  onChange={(event) =>
                    setBranchCity(event.target.value)
                  }
                  placeholder="Ej. Sucre"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-primary-light pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowBranchForm(false)
                }
                disabled={creatingBranch}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={creatingBranch}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingBranch
                  ? 'Creando...'
                  : 'Crear sucursal'}
              </button>
            </div>
          </form>
        )}

        {/* Editar sucursal */}
        {editingBranchId !== null && (
          <form
            onSubmit={handleUpdateBranch}
            className="mt-6 rounded-2xl border border-primary-light bg-primary-soft/50 p-5"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Editar sucursal
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Actualiza la información de esta sucursal.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-branch-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nombre
                </label>

                <input
                  id="edit-branch-name"
                  type="text"
                  value={branchName}
                  onChange={(event) =>
                    setBranchName(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-branch-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Teléfono
                </label>

                <input
                  id="edit-branch-phone"
                  type="tel"
                  value={branchPhone}
                  onChange={(event) =>
                    setBranchPhone(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="edit-branch-address"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Dirección
                </label>

                <input
                  id="edit-branch-address"
                  type="text"
                  value={branchAddress}
                  onChange={(event) =>
                    setBranchAddress(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-branch-city"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Ciudad
                </label>

                <input
                  id="edit-branch-city"
                  type="text"
                  value={branchCity}
                  onChange={(event) =>
                    setBranchCity(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-primary-light pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEditingBranch}
                disabled={updatingBranch}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={updatingBranch}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingBranch
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {branchesLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : branches.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              Aún no tienes sucursales
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Crea tu primera sucursal para indicar dónde
              pueden encontrar tu negocio.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-primary-light hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900">
                      {branch.name}
                    </h3>

                    <div className="mt-3 space-y-2 text-sm text-slate-500">
                      <div className="flex items-start gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                          />
                          <circle
                            cx="12"
                            cy="10"
                            r="2.5"
                          />
                        </svg>

                        <span>
                          {branch.address}
                          {branch.city
                            ? `, ${branch.city}`
                            : ''}
                        </span>
                      </div>

                      {branch.phone && (
                        <div className="flex items-center gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.5 3.5h3l1.5 5-2.5 1.5a15 15 0 0 0 6.5 6.5l1.5-2.5 5 1.5v3c0 1.1-.9 2-2 2C11.5 20.5 3.5 12.5 3.5 4.5c0-1.1.9-2-2-2Z"
                            />
                          </svg>

                          <span>{branch.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      branch.status
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {branch.status
                      ? 'Activa'
                      : 'Inactiva'}
                  </span>
                </div>

                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      startEditingBranch(branch)
                    }
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary-light hover:bg-primary-soft hover:text-primary-dark"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => setBranchToToggle(branch)}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      branch.status
                        ? 'border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {branch.status ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {branchToToggle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() => {
            if (!togglingBranch) {
              setBranchToToggle(null);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 sm:p-7">
              {/* Icono */}
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  branchToToggle.status
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {branchToToggle.status ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 17h.01"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12.5 9.5 17 19 7.5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3a9 9 0 1 0 9 9"
                    />
                  </svg>
                )}
              </div>

              {/* Contenido */}
              <div className="mt-5">
                <h3 className="text-xl font-bold text-slate-900">
                  {branchToToggle.status
                    ? '¿Desactivar sucursal?'
                    : '¿Activar sucursal?'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {branchToToggle.status
                    ? 'La sucursal dejará de estar disponible para los clientes. Podrás activarla nuevamente cuando quieras.'
                    : 'La sucursal volverá a estar disponible para los clientes.'}
                </p>

                {/* Sucursal seleccionada */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    {branchToToggle.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {branchToToggle.address}
                    {branchToToggle.city
                      ? `, ${branchToToggle.city}`
                      : ''}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={togglingBranch}
                  onClick={() =>
                    setBranchToToggle(null)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={togglingBranch}
                  onClick={handleToggleBranch}
                  className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    branchToToggle.status
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {togglingBranch
                    ? branchToToggle.status
                      ? 'Desactivando...'
                      : 'Activando...'
                    : branchToToggle.status
                      ? 'Desactivar sucursal'
                      : 'Activar sucursal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}