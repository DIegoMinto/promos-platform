
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Truck, Upload } from 'lucide-react';
import { useAuth } from '../context/useAuth';

type FulfillmentType = 'DELIVERY' | 'PICKUP';
type PaymentMethod = 'TRANSFER' | 'CASH_ON_PICKUP';

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  status?: boolean;
}

interface CartItem {
  id: number;
  promotionId: number;
  title: string;
  image: string | null;
  business: {
    id: number;
    name: string;
    logo: string | null;
    status?: boolean;
  };
  quantity: number;
  fulfillmentType: FulfillmentType;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  unavailableReason: string | null;
}

interface CartData {
  id: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

interface PromotionDetails {
  id: number;
  business: {
    id: number;
    name: string;
    deliveryEnabled?: boolean;
    deliveryFee?: number | string;
  };
  branches: {
    branchId: number;
    branch: Branch;
  }[];
}

interface BusinessGroup {
  key: string;
  businessId: number;
  businessName: string;
  fulfillmentType: FulfillmentType;
  items: CartItem[];
  branches: Branch[];
  deliveryEnabled: boolean;
  deliveryFee: number;
}

interface OrderOption {
  branchId: string;
  deliveryAddress: string;
  deliveryNotes: string;
  paymentMethod: PaymentMethod;
}

interface CreatedOrder {
  id: number;
  reference: string;
  total: number | string;
  fulfillmentType: FulfillmentType;
  business?: {
    name: string;
    paymentQrUrl?: string | null;
  };
  branch?: {
    name: string;
    address: string;
  } | null;
  deliveryAddress?: string | null;
  payment?: {
    paymentMethod: PaymentMethod;
    status?: string;
    qrImageUrl?: string | null;
  } | null;
}

interface CheckoutResult {
  reference?: string;
  orders?: CreatedOrder[];
}

const apiUrl = import.meta.env.VITE_API_URL;

export default function Checkout() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartData | null>(null);
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [options, setOptions] = useState<Record<string, OrderOption>>({});
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutResult, setCheckoutResult] =
    useState<CheckoutResult | null>(null);

  // Estados para los comprobantes de pago.
  const [receiptFiles, setReceiptFiles] = useState<Record<number, File>>({});
  const [sendingReceiptId, setSendingReceiptId] = useState<number | null>(
    null,
  );
  const [submittedReceiptIds, setSubmittedReceiptIds] = useState<number[]>(
    [],
  );
  const [receiptErrors, setReceiptErrors] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    if (!user || user.role !== 'CLIENTE' || !accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function loadCheckout() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${apiUrl}/api/cart`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar tu carrito.');
        }

        const cartData: CartData = await response.json();

        if (!cartData.items.length) {
          if (!cancelled) {
            setCart(cartData);
            setGroups([]);
            setOptions({});
          }
          return;
        }

        if (cartData.items.some((item) => !item.available)) {
          throw new Error(
            'Tu carrito contiene promociones no disponibles. ' +
              'Vuelve al carrito y retíralas antes de continuar.',
          );
        }

        const details = await Promise.all(
          cartData.items.map(async (item) => {
            const detailResponse = await fetch(
              `${apiUrl}/api/promotions/${item.promotionId}`,
            );

            if (!detailResponse.ok) {
              throw new Error(
                `No se pudieron verificar los datos de "${item.title}".`,
              );
            }

            return (await detailResponse.json()) as PromotionDetails;
          }),
        );

        const detailsByPromotion = new Map(
          details.map((detail) => [detail.id, detail]),
        );
        console.table(
  details.map((detail) => ({
    promotionId: detail.id,
    businessId: detail.business.id,
    branches: (detail.branches ?? [])
      .map(({ branch }) => ({
        id: branch.id,
        name: branch.name,
        status: branch.status,
      })),
  })),
);

        const grouped = new Map<string, BusinessGroup>();

        for (const item of cartData.items) {
          const detail = detailsByPromotion.get(item.promotionId);

          if (!detail) {
            throw new Error(
              `No se encontraron los datos de "${item.title}".`,
            );
          }

          const businessId = item.business.id;
          const groupKey = `${businessId}:${item.fulfillmentType}`;
          const existing = grouped.get(groupKey);

          const branches = (detail.branches ?? [])
            .filter(({ branch }) => branch.status !== false)
            .map(({ branch }) => branch);

          if (existing) {
            existing.items.push(item);

            if (item.fulfillmentType === 'PICKUP') {
              existing.branches = existing.branches.filter((branch) =>
                branches.some((candidate) => candidate.id === branch.id),
              );
            }
          } else {
            grouped.set(groupKey, {
              key: groupKey,
              businessId,
              businessName: item.business.name,
              fulfillmentType: item.fulfillmentType,
              items: [item],
              branches,
              deliveryEnabled: detail.business.deliveryEnabled ?? false,
              deliveryFee: Number(detail.business.deliveryFee ?? 0),
            });
          }
        }

        const nextGroups = Array.from(grouped.values());

        if (!cancelled) {
          setCart(cartData);
          setGroups(nextGroups);

          const initialOptions: Record<string, OrderOption> = {};

          nextGroups.forEach((group) => {
            initialOptions[group.key] = {
              branchId:
                group.fulfillmentType === 'PICKUP' &&
                group.branches.length === 1
                  ? String(group.branches[0].id)
                  : '',
              deliveryAddress: '',
              deliveryNotes: '',
              paymentMethod: 'TRANSFER',
            };
          });

          setOptions(initialOptions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al preparar tu pedido.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [user, accessToken, navigate]);

  const subtotal = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total + group.items.reduce((sum, item) => sum + item.lineTotal, 0),
        0,
      ),
    [groups],
  );

  const deliveryTotal = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total +
          (group.fulfillmentType === 'DELIVERY' ? group.deliveryFee : 0),
        0,
      ),
    [groups],
  );

  const total = subtotal + deliveryTotal;

  function updateOption(
    groupKey: string,
    changes: Partial<OrderOption>,
  ) {
    setOptions((current) => ({
      ...current,
      [groupKey]: {
        ...current[groupKey],
        ...changes,
      },
    }));
  }

  async function submitCheckout(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');

    if (!accessToken || !user) {
      navigate('/login');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Ingresa tu número de teléfono.');
      return;
    }

    for (const group of groups) {
      const option = options[group.key];

      if (!option) {
        setError('No se encontraron las opciones de un pedido.');
        return;
      }

      if (group.fulfillmentType === 'DELIVERY') {
        if (!group.deliveryEnabled) {
          setError(
            `${group.businessName} no tiene habilitada la entrega a domicilio.`,
          );
          return;
        }

        if (!option.deliveryAddress.trim()) {
          setError(
            `Ingresa la dirección de entrega para ${group.businessName}.`,
          );
          return;
        }
      }

      if (group.fulfillmentType === 'PICKUP') {
        if (!option.branchId) {
          setError(`Selecciona una sucursal para ${group.businessName}.`);
          return;
        }

        if (
          !group.branches.some(
            (branch) => String(branch.id) === option.branchId,
          )
        ) {
          setError(
            `La sucursal seleccionada para ${group.businessName} ` +
              'no está disponible para todas las promociones del pedido.',
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const orders = groups.map((group) => {
        const option = options[group.key];

        const paymentMethod: PaymentMethod =
          group.fulfillmentType === 'DELIVERY'
            ? 'TRANSFER'
            : option.paymentMethod === 'CASH_ON_PICKUP'
              ? 'CASH_ON_PICKUP'
              : 'TRANSFER';

        return {
          businessId: group.businessId,
          fulfillmentType: group.fulfillmentType,
          paymentMethod,
          ...(group.fulfillmentType === 'PICKUP'
            ? { branchId: Number(option.branchId) }
            : {
                deliveryAddress: option.deliveryAddress.trim(),
                deliveryNotes: option.deliveryNotes.trim(),
              }),
        };
      });

      const payload = {
        customerName: user.name,
        customerPhone: customerPhone.trim(),
        orders,
      };

      const response = await fetch(`${apiUrl}/api/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message ?? 'No se pudo crear el pedido.',
        );
      }

      setCheckoutResult(data as CheckoutResult);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al confirmar tu pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReceipt(orderId: number) {
    const file = receiptFiles[orderId];

    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (!file) {
      setReceiptErrors((current) => ({
        ...current,
        [orderId]: 'Selecciona la imagen de tu comprobante.',
      }));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setReceiptErrors((current) => ({
        ...current,
        [orderId]: 'El comprobante debe ser JPG, PNG o WEBP.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setReceiptErrors((current) => ({
        ...current,
        [orderId]: 'La imagen no debe superar los 5 MB.',
      }));
      return;
    }

    setSendingReceiptId(orderId);
    setReceiptErrors((current) => ({ ...current, [orderId]: '' }));

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}/payment-submissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message ?? 'No se pudo enviar el comprobante.',
        );
      }

      setSubmittedReceiptIds((current) =>
        current.includes(orderId) ? current : [...current, orderId],
      );

      setReceiptFiles((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      setReceiptErrors((current) => ({
        ...current,
        [orderId]:
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al enviar el comprobante.',
      }));
    } finally {
      setSendingReceiptId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-500">Preparando tu compra...</p>
      </main>
    );
  }

  if (checkoutResult) {
    const orders = checkoutResult.orders ?? [];

    return (
      <main className="min-h-screen bg-surface px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              ¡Pedido creado!
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tus pedidos quedaron registrados. Revisa los detalles y las
              instrucciones de pago correspondientes.
            </p>

            {checkoutResult.reference && (
              <p className="mt-4 text-sm text-slate-600">
                Referencia de compra:{' '}
                <strong>{checkoutResult.reference}</strong>
              </p>
            )}
          </div>

          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const qrUrl =
                order.business?.paymentQrUrl ??
                order.payment?.qrImageUrl ??
                null;

              const isTransfer =
                order.payment?.paymentMethod === 'TRANSFER';

              const submitted = submittedReceiptIds.includes(order.id);

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {order.business?.name ?? 'Negocio'}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Pedido: {order.reference}
                      </p>
                    </div>

                    <span className="text-sm font-black text-primary">
                      Bs. {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {order.fulfillmentType === 'DELIVERY'
                      ? 'Entrega a domicilio'
                      : 'Recogida en sucursal'}
                  </p>

                  {order.branch && (
                    <p className="mt-1 text-sm text-slate-600">
                      {order.branch.name} — {order.branch.address}
                    </p>
                  )}

                  {order.deliveryAddress && (
                    <p className="mt-1 text-sm text-slate-600">
                      Dirección: {order.deliveryAddress}
                    </p>
                  )}

                  {isTransfer && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {qrUrl ? (
                        <>
                          <p className="mb-2 text-sm font-bold text-slate-800">
                            QR de pago
                          </p>
                          <img
                            src={qrUrl}
                            alt="QR de pago del negocio"
                            className="mx-auto max-h-64 w-auto rounded-xl object-contain"
                          />
                        </>
                      ) : (
                        <p className="text-sm text-amber-800">
                          El negocio no tiene un QR configurado. Contacta con
                          el negocio para solicitar sus datos de pago antes de
                          transferir.
                        </p>
                      )}

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Después de realizar la transferencia, adjunta una
                        imagen legible del comprobante para que el negocio
                        pueda verificar el pago.
                      </p>

                      {submitted ? (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                          <p className="font-bold text-green-800">
                            ✓ Comprobante enviado
                          </p>
                          <p className="mt-1 text-sm text-green-700">
                            Tu comprobante fue recibido. El pago está pendiente
                            de revisión.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            Imagen del comprobante
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                              JPG, PNG o WEBP. Máximo 5 MB.
                            </span>

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (!file) return;

                                setReceiptFiles((current) => ({
                                  ...current,
                                  [order.id]: file,
                                }));

                                setReceiptErrors((current) => ({
                                  ...current,
                                  [order.id]: '',
                                }));
                              }}
                              className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white"
                            />
                          </label>

                          {receiptFiles[order.id] && (
                            <p className="break-all text-xs text-slate-500">
                              Archivo seleccionado:{' '}
                              {receiptFiles[order.id].name}
                            </p>
                          )}

                          {receiptErrors[order.id] && (
                            <p
                              role="alert"
                              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                            >
                              {receiptErrors[order.id]}
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={sendingReceiptId === order.id}
                            onClick={() => void submitReceipt(order.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Upload size={18} />
                            {sendingReceiptId === order.id
                              ? 'ENVIANDO COMPROBANTE...'
                              : 'ENVIAR COMPROBANTE'}
                          </button>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-amber-700">
                        Tu pedido está pendiente de la verificación del pago.
                      </p>
                    </div>
                  )}

                  {order.payment?.paymentMethod === 'CASH_ON_PICKUP' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-900">
                        Pago en efectivo
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Pagarás en la sucursal al recoger tu pedido. No
                        necesitas enviar un comprobante de transferencia.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-black text-white transition hover:opacity-90"
          >
            VOLVER A LAS PROMOCIONES
          </button>
        </section>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate('/carrito')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          VOLVER AL CARRITO
        </button>
      </main>
    );
  }

  if (!cart?.items.length || groups.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Añade una promoción para comenzar tu compra.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          VER PROMOCIONES
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/carrito')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary"
        >
          <ArrowLeft size={18} />
          Volver al carrito
        </button>

        <h1 className="text-3xl font-black text-slate-900">
          Finalizar compra
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Confirma tus datos y revisa cómo recibirás cada pedido.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={submitCheckout}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-black text-slate-900">
                Tus datos
              </h2>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Nombre
                <input
                  value={user?.name ?? ''}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                />
              </label>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Teléfono de contacto
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  required
                  maxLength={40}
                  placeholder="Ej. 7XXXXXXX"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </section>

            {groups.map((group) => {
              const option = options[group.key];

              if (!option) return null;

              return (
                <section
                  key={group.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <h2 className="text-lg font-black text-slate-900">
                    {group.businessName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'promoción' : 'promociones'}
                  </p>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      {group.fulfillmentType === 'DELIVERY' ? (
                        <Truck size={22} className="text-primary" />
                      ) : (
                        <Store size={22} className="text-primary" />
                      )}

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {group.fulfillmentType === 'DELIVERY'
                            ? 'A mi puerta'
                            : 'Paso a recogerlo'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Modalidad seleccionada para estas promociones
                        </p>
                      </div>
                    </div>

                    {group.fulfillmentType === 'DELIVERY' && (
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        Costo de envío: Bs. {group.deliveryFee.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {group.fulfillmentType === 'DELIVERY' && (
                    <div className="mt-5 space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        Dirección de entrega
                        <textarea
                          value={option.deliveryAddress}
                          onChange={(event) =>
                            updateOption(group.key, {
                              deliveryAddress: event.target.value,
                            })
                          }
                          required
                          maxLength={500}
                          rows={3}
                          placeholder="Calle, número, zona y referencias"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </label>

                      <label className="block text-sm font-semibold text-slate-700">
                        Referencias adicionales (opcional)
                        <textarea
                          value={option.deliveryNotes}
                          onChange={(event) =>
                            updateOption(group.key, {
                              deliveryNotes: event.target.value,
                            })
                          }
                          maxLength={500}
                          rows={2}
                          placeholder="Indicaciones para encontrar tu domicilio"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                  )}

                  {group.fulfillmentType === 'PICKUP' && (
                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-800">
                          Sucursal donde recogerás tu pedido
                        </label>

                        {group.branches.length > 0 ? (
                          <select
                            value={option.branchId}
                            onChange={(event) =>
                              updateOption(group.key, {
                                branchId: event.target.value,
                              })
                            }
                            required
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Selecciona una sucursal</option>
                            {group.branches.map((branch) => (
                              <option key={branch.id} value={String(branch.id)}>
                                {branch.name} — {branch.address}
                                {branch.city ? `, ${branch.city}` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p
                            role="alert"
                            className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                          >
                            No encontramos sucursales disponibles para todas
                            las promociones de este pedido. Verifica las
                            sucursales configuradas por el negocio.
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          ¿Cómo quieres pagar?
                        </h3>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              option.paymentMethod === 'TRANSFER'
                                ? 'border-primary bg-primary/5'
                                : 'border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`payment-${group.key}`}
                              value="TRANSFER"
                              checked={option.paymentMethod === 'TRANSFER'}
                              onChange={() =>
                                updateOption(group.key, {
                                  paymentMethod: 'TRANSFER',
                                })
                              }
                              className="mr-2 accent-primary"
                            />
                            <span className="text-sm font-bold text-slate-900">
                              Transferencia
                            </span>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Envía tu comprobante y espera la aprobación del
                              pago.
                            </p>
                          </label>

                          <label
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              option.paymentMethod === 'CASH_ON_PICKUP'
                                ? 'border-primary bg-primary/5'
                                : 'border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`payment-${group.key}`}
                              value="CASH_ON_PICKUP"
                              checked={
                                option.paymentMethod === 'CASH_ON_PICKUP'
                              }
                              onChange={() =>
                                updateOption(group.key, {
                                  paymentMethod: 'CASH_ON_PICKUP',
                                })
                              }
                              className="mr-2 accent-primary"
                            />
                            <span className="text-sm font-bold text-slate-900">
                              Efectivo en sucursal
                            </span>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Paga al recoger tu pedido. No necesitas enviar
                              un comprobante anticipado.
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=200'
                          }
                          alt={item.title}
                          className="h-14 w-14 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            Cantidad: {item.quantity}
                          </p>
                        </div>

                        <p className="text-sm font-black text-slate-900">
                          Bs. {item.lineTotal.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-black text-slate-900">
              Resumen del pedido
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3 text-slate-600">
                <span>Productos</span>
                <span>Bs. {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between gap-3 text-slate-600">
                <span>Envío</span>
                <span>Bs. {deliveryTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between gap-3 border-t border-slate-100 pt-4 text-base font-black text-slate-900">
                <span>Total estimado</span>
                <span>Bs. {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-accent py-3.5 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'CREANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}
