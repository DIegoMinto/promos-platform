
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
} from 'react-leaflet';

import LocationPicker from '../components/LocationPicker';
import { useAuth } from '../../context/useAuth';

import 'leaflet/dist/leaflet.css';

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
  paymentQrUrl: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: number | string;
  deliveryInstructions: string | null;
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

const API_URL = import.meta.env.VITE_API_URL;

function BranchMapPreview({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        style={{ height: '160px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[latitude, longitude]}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: '#075e54',
            fillOpacity: 1,
          }}
        />
      </MapContainer>
    </div>
  );
}

export default function MyBusiness() {
  const { accessToken } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [businessLatitude, setBusinessLatitude] =
    useState<number | null>(null);
  const [businessLongitude, setBusinessLongitude] =
    useState<number | null>(null);

  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);

  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);

  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchLatitude, setBranchLatitude] = useState<number | null>(null);
  const [branchLongitude, setBranchLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [updatingBranch, setUpdatingBranch] = useState(false);
  const [togglingBranch, setTogglingBranch] = useState(false);

  const [branchToToggle, setBranchToToggle] = useState<Branch | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function applyBusiness(data: Business) {
    setBusiness(data);
    setName(data.name ?? '');
    setDescription(data.description ?? '');
    setPhone(data.phone ?? '');
    setAddress(data.address ?? '');
    setCity(data.city ?? '');
    setBusinessLatitude(data.latitude ?? null);
    setBusinessLongitude(data.longitude ?? null);
    setPaymentQrUrl(data.paymentQrUrl ?? '');
    setPickupEnabled(data.pickupEnabled ?? true);
    setDeliveryEnabled(data.deliveryEnabled ?? false);
    setDeliveryFee(String(data.deliveryFee ?? 0));
    setDeliveryInstructions(data.deliveryInstructions ?? '');
  }

  useEffect(() => {
    if (!qrPreview) return;

    return () => URL.revokeObjectURL(qrPreview);
  }, [qrPreview]);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) {
        setLoading(false);
        setBranchesLoading(false);
        return;
      }

      try {
        setLoading(true);
        setBranchesLoading(true);
        setError('');

        const [businessResponse, branchesResponse] = await Promise.all([
          fetch(`${API_URL}/api/businesses/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${API_URL}/api/branches`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (!businessResponse.ok) {
          throw new Error('No se pudo cargar la información del negocio.');
        }

        if (!branchesResponse.ok) {
          throw new Error('No se pudieron cargar las sucursales.');
        }

        const businessData: Business = await businessResponse.json();
        const branchesData: Branch[] = await branchesResponse.json();

        applyBusiness(businessData);
        setBranches(branchesData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al cargar la información.',
        );
      } finally {
        setLoading(false);
        setBranchesLoading(false);
      }
    }

    void loadData();
  }, [accessToken]);

  function selectQr(file?: File) {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('El QR debe ser una imagen PNG, JPG o WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen del QR no debe superar los 5 MB.');
      return;
    }

    setError('');
    setSuccess('');
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  }

  async function handleQrUpload() {
    if (!accessToken || !qrFile) {
      setError('Selecciona una imagen para el código QR.');
      return;
    }

    try {
      setUploadingQr(true);
      setError('');
      setSuccess('');

      // Subir la imagen usando el endpoint de imágenes existente.
      const formData = new FormData();
      formData.append('image', qrFile);

      const uploadResponse = await fetch(
        `${API_URL}/api/promotions/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json().catch(() => null);

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData?.message || 'No se pudo subir la imagen del QR.',
        );
      }

      const imageUrl =
        uploadData?.url ?? uploadData?.secure_url ?? uploadData?.imageUrl;

      if (typeof imageUrl !== 'string' || !imageUrl) {
        throw new Error(
          'La respuesta de la subida no contiene la URL de la imagen.',
        );
      }

      // Guardar en el negocio la URL obtenida de Cloudinary.
      const saveResponse = await fetch(`${API_URL}/api/businesses/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentQrUrl: imageUrl }),
      });

      const savedData = await saveResponse.json().catch(() => null);

      if (!saveResponse.ok) {
        throw new Error(
          savedData?.message || 'La imagen se subió, pero no se pudo guardar en el negocio.',
        );
      }

      // Actualizar los datos sin asumir que la API devuelve todos los campos.
      setPaymentQrUrl(imageUrl);
      setBusiness((current) =>
        current ? { ...current, paymentQrUrl: imageUrl } : current,
      );

      setQrFile(null);
      setQrPreview('');
      setSuccess('La imagen del QR se guardó correctamente.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar el QR.',
      );
    } finally {
      setUploadingQr(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) return;

    if (!pickupEnabled && !deliveryEnabled) {
      setError('Activa al menos una modalidad de entrega para recibir pedidos.');
      setSuccess('');
      return;
    }

    if (
      deliveryEnabled &&
      (!deliveryFee.trim() ||
        !Number.isFinite(Number(deliveryFee)) ||
        Number(deliveryFee) < 0)
    ) {
      setError('Ingresa un costo de envío válido.');
      setSuccess('');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/api/businesses/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          latitude: businessLatitude,
          longitude: businessLongitude,
          paymentQrUrl: paymentQrUrl.trim() || null,
          pickupEnabled,
          deliveryEnabled,
          deliveryFee: Number(deliveryFee),
          deliveryInstructions: deliveryInstructions.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'No se pudo actualizar la información.',
        );
      }

      applyBusiness(data);
      setSuccess('La información del negocio se actualizó correctamente.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al actualizar el negocio.',
      );
    } finally {
      setSaving(false);
    }
  }

  function resetBranchForm() {
    setBranchName('');
    setBranchAddress('');
    setBranchCity('');
    setBranchPhone('');
    setBranchLatitude(null);
    setBranchLongitude(null);
  }

  function startEditingBranch(branch: Branch) {
    setEditingBranchId(branch.id);
    setBranchName(branch.name);
    setBranchAddress(branch.address);
    setBranchCity(branch.city ?? '');
    setBranchPhone(branch.phone ?? '');
    setBranchLatitude(branch.latitude);
    setBranchLongitude(branch.longitude);
    setShowBranchForm(false);
    setError('');
    setSuccess('');

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function cancelEditingBranch() {
    setEditingBranchId(null);
    resetBranchForm();
    setError('');
  }

  async function submitBranch(
    event: FormEvent<HTMLFormElement>,
    editing: boolean,
  ) {
    event.preventDefault();
    if (!accessToken) return;

    try {
      if (editing) setUpdatingBranch(true);
      else setCreatingBranch(true);

      setError('');
      setSuccess('');

      const url = editing
        ? `${API_URL}/api/branches/${editingBranchId}`
        : `${API_URL}/api/branches`;

      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: branchName.trim(),
          address: branchAddress.trim(),
          city: branchCity.trim() || undefined,
          phone: branchPhone.trim() || undefined,
          latitude: branchLatitude,
          longitude: branchLongitude,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `No se pudo ${editing ? 'actualizar' : 'crear'} la sucursal.`,
        );
      }

      const savedBranch: Branch = data;

      if (editing) {
        setBranches((current) =>
          current.map((branch) =>
            branch.id === savedBranch.id ? savedBranch : branch,
          ),
        );
        setEditingBranchId(null);
        setSuccess('La sucursal se actualizó correctamente.');
      } else {
        setBranches((current) => [savedBranch, ...current]);
        setShowBranchForm(false);
        setSuccess('La sucursal se creó correctamente.');
      }

      resetBranchForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error con la sucursal.',
      );
    } finally {
      setCreatingBranch(false);
      setUpdatingBranch(false);
    }
  }

  async function handleToggleBranch() {
    if (!accessToken || !branchToToggle) return;

    try {
      setTogglingBranch(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        branchToToggle.status
          ? `${API_URL}/api/branches/${branchToToggle.id}`
          : `${API_URL}/api/branches/${branchToToggle.id}/restore`,
        {
          method: branchToToggle.status ? 'DELETE' : 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo actualizar la sucursal.');
      }

      const updatedBranch: Branch = data;

      setBranches((current) =>
        current.map((branch) =>
          branch.id === updatedBranch.id ? updatedBranch : branch,
        ),
      );

      setSuccess(
        updatedBranch.status
          ? 'La sucursal se activó correctamente.'
          : 'La sucursal se desactivó correctamente.',
      );
      setBranchToToggle(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al actualizar la sucursal.',
      );
    } finally {
      setTogglingBranch(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Configuración</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Mi negocio
          </h1>
          <p className="mt-2 text-sm text-slate-500">Cargando información...</p>
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

  const branchFormOpen = showBranchForm || editingBranchId !== null;
  const editing = editingBranchId !== null;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Configuración</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Mi negocio
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Administra la información que verán los clientes.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">{success}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-soft text-3xl font-black text-primary">
              {business?.name?.charAt(0).toUpperCase() || 'N'}
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {business?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Información pública del negocio
            </p>
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Información general</h2>
          <p className="mt-1 text-sm text-slate-500">
            Actualiza los datos principales de tu negocio.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="business-name" className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre del negocio
              </label>
              <input
                id="business-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label htmlFor="business-description" className="mb-2 block text-sm font-semibold text-slate-700">
                Descripción
              </label>
              <textarea
                id="business-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe brevemente tu negocio"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label htmlFor="business-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>
              <input
                id="business-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 70000000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label htmlFor="business-address" className="mb-2 block text-sm font-semibold text-slate-700">
                Dirección
              </label>
              <input
                id="business-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Calle Junín #123"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div>
              <label htmlFor="business-city" className="mb-2 block text-sm font-semibold text-slate-700">
                Ciudad
              </label>
              <input
                id="business-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Sucre"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <LocationPicker
              latitude={businessLatitude}
              longitude={businessLongitude}
              onChange={(lat, lng) => {
                setBusinessLatitude(lat);
                setBusinessLongitude(lng);
              }}
            />

            {/* Pagos y entregas: esta sección aparece únicamente aquí. */}
            <section className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">Pagos y entregas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Configura cómo pagarán y recibirán sus pedidos tus clientes.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Código QR de pago
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona la imagen de tu QR bancario. Se mostrará a los clientes
                  durante el proceso de pago.
                </p>

                {(qrPreview || paymentQrUrl) ? (
                  <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                      <img
                        src={qrPreview || paymentQrUrl}
                        alt="Código QR de pago del negocio"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-slate-500">
                      {qrFile
                        ? 'Vista previa de la nueva imagen. Pulsa Guardar imagen del QR para aplicarla.'
                        : 'Esta es la imagen de QR guardada actualmente.'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                    Todavía no has cargado un QR de pago.
                  </div>
                )}

                <div className="mt-4">
                  <label htmlFor="payment-qr-file" className="mb-2 block text-sm font-semibold text-slate-700">
                    Imagen del QR (PNG, JPG o WEBP)
                  </label>
                  <input
                    id="payment-qr-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => selectQr(e.target.files?.[0])}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:bg-primary-light"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Tamaño máximo: 5 MB. La imagen anterior seguirá guardada hasta
                    que subas y guardes la nueva.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQrUpload}
                  disabled={!qrFile || uploadingQr}
                  className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingQr ? 'Subiendo imagen...' : 'Guardar imagen del QR'}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    onChange={(e) => setPickupEnabled(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Recojo en el local</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      El cliente recoge su pedido en tu negocio.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Entrega a domicilio</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Permite que los clientes reciban sus pedidos en una dirección.
                    </span>
                  </span>
                </label>
              </div>

              {deliveryEnabled && (
                <div className="mt-5 space-y-5 rounded-xl bg-slate-50 p-4">
                  <div>
                    <label htmlFor="delivery-fee" className="mb-2 block text-sm font-semibold text-slate-700">
                      Costo de envío (Bs)
                    </label>
                    <input
                      id="delivery-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                    />
                  </div>

                  <div>
                    <label htmlFor="delivery-instructions" className="mb-2 block text-sm font-semibold text-slate-700">
                      Instrucciones de entrega
                    </label>
                    <textarea
                      id="delivery-instructions"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={3}
                      placeholder="Ej. Entregas dentro del centro de la ciudad."
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                    />
                  </div>
                </div>
              )}

              {!pickupEnabled && !deliveryEnabled && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Activa al menos una modalidad de entrega para recibir pedidos.
                </p>
              )}
            </section>
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Sucursales */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sucursales</h2>
            <p className="mt-1 text-sm text-slate-500">
              Administra los lugares donde opera tu negocio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showBranchForm) resetBranchForm();
              setShowBranchForm((current) => !current);
              setEditingBranchId(null);
              setError('');
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            {showBranchForm ? 'Cerrar formulario' : 'Nueva sucursal'}
          </button>
        </div>

        {branchFormOpen && (
          <form
            onSubmit={(e) => submitBranch(e, editing)}
            className="mt-6 rounded-2xl border border-primary-light bg-primary-soft/50 p-5"
          >
            <h3 className="text-base font-bold text-slate-900">
              {editing ? 'Editar sucursal' : 'Nueva sucursal'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {editing
                ? 'Actualiza la información de esta sucursal.'
                : 'Registra una ubicación donde tus clientes puedan encontrar tu negocio.'}
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="branch-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre
                </label>
                <input
                  id="branch-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Ej. Sucursal San Roque"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label htmlFor="branch-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                  Teléfono
                </label>
                <input
                  id="branch-phone"
                  type="tel"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="branch-address" className="mb-2 block text-sm font-semibold text-slate-700">
                  Dirección
                </label>
                <input
                  id="branch-address"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Ej. Calle Junín #456"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div>
                <label htmlFor="branch-city" className="mb-2 block text-sm font-semibold text-slate-700">
                  Ciudad
                </label>
                <input
                  id="branch-city"
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  placeholder="Ej. Sucre"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>
            </div>

            <div className="mt-6">
              <LocationPicker
                latitude={branchLatitude}
                longitude={branchLongitude}
                onChange={(lat, lng) => {
                  setBranchLatitude(lat);
                  setBranchLongitude(lng);
                }}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-primary-light pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={creatingBranch || updatingBranch}
                onClick={() => {
                  setShowBranchForm(false);
                  setEditingBranchId(null);
                  resetBranchForm();
                  setError('');
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingBranch || updatingBranch}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {creatingBranch || updatingBranch
                  ? 'Guardando...'
                  : editing
                    ? 'Guardar cambios'
                    : 'Crear sucursal'}
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
            <h3 className="text-sm font-bold text-slate-900">Aún no tienes sucursales</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Crea tu primera sucursal para indicar dónde pueden encontrar tu negocio.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {branches.map((branch) => (
              <article
                key={branch.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-primary-light hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900">
                      {branch.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {branch.address}{branch.city ? `, ${branch.city}` : ''}
                    </p>
                    {branch.phone && (
                      <p className="mt-1 text-sm text-slate-500">{branch.phone}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      branch.status
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {branch.status ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {branch.latitude !== null && branch.longitude !== null ? (
                  <BranchMapPreview
                    latitude={branch.latitude}
                    longitude={branch.longitude}
                  />
                ) : (
                  <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    Ubicación no registrada. Pulsa Editar para seleccionar un punto en el mapa.
                  </p>
                )}

                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => startEditingBranch(branch)}
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
              </article>
            ))}
          </div>
        )}
      </section>

      {branchToToggle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() => {
            if (!togglingBranch) setBranchToToggle(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                branchToToggle.status
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <span className="text-2xl font-bold">
                {branchToToggle.status ? '!' : '✓'}
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              {branchToToggle.status ? '¿Desactivar sucursal?' : '¿Activar sucursal?'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {branchToToggle.status
                ? 'La sucursal dejará de estar disponible para los clientes. Podrás activarla nuevamente cuando quieras.'
                : 'La sucursal volverá a estar disponible para los clientes.'}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{branchToToggle.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {branchToToggle.address}
                {branchToToggle.city ? `, ${branchToToggle.city}` : ''}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={togglingBranch}
                onClick={() => setBranchToToggle(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={togglingBranch}
                onClick={handleToggleBranch}
                className={`rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60 ${
                  branchToToggle.status
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {togglingBranch
                  ? 'Procesando...'
                  : branchToToggle.status
                    ? 'Desactivar sucursal'
                    : 'Activar sucursal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
