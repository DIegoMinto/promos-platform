
import { useEffect, useState } from 'react';
import { ArrowLeft, Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';

type OrderStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_REVIEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

type PaymentMethod = 'TRANSFER' | 'CASH_ON_PICKUP';

type PaymentStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

type FulfillmentType = 'DELIVERY' | 'PICKUP';

interface OrderItem {
  id: number;
  promotionTitle: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

interface Order {
  id: number;
  reference: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  subtotal: number | string;
  deliveryFee: number | string;
  total: number | string;
  createdAt: string;
  deliveryAddress: string | null;
  business: {
    id: number;
    name: string;
    phone?: string | null;
    logo?: string | null;
    paymentQrUrl?: string | null;
  };
  branch?: {
    id: number;
    name: string;
    address: string;
  } | null;
  items: OrderItem[];
payment?: {
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  qrImageUrl?: string | null;
} | null;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PENDING_PAYMENT: 'Pendiente de pago',
  PAYMENT_REVIEW: 'Comprobante en revisión',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recoger',
  OUT_FOR_DELIVERY: 'En camino',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rechazado',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente de pago',
  UNDER_REVIEW: 'Comprobante en revisión',
  APPROVED: 'Pago aprobado',
  REJECTED: 'Pago rechazado',
  CANCELLED: 'Pago cancelado',
};

function getPaymentLabel(
  status: PaymentStatus | undefined,
  method: PaymentMethod | undefined,
) {
  if (method === 'CASH_ON_PICKUP' && status === 'PENDING') {
    return 'Pago pendiente en sucursal';
  }

  return status
    ? paymentStatusLabels[status] ?? status
    : 'Sin información';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700';
    case 'CONFIRMED':
    case 'PREPARING':
    case 'READY_FOR_PICKUP':
    case 'OUT_FOR_DELIVERY':
      return 'bg-blue-50 text-blue-700';
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-amber-50 text-amber-800';
  }
}

function formatMoney(value: number | string) {
  return `Bs. ${Number(value).toFixed(2)}`;
}

export default function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL;
const [receiptFiles, setReceiptFiles] = useState<
  Record<number, File | null>
>({});
const [transferReferences, setTransferReferences] = useState<
  Record<number, string>
>({});
const [customerNotes, setCustomerNotes] = useState<
  Record<number, string>
>({});
const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(
  null,
);
const [receiptMessages, setReceiptMessages] = useState<
  Record<number, { type: 'success' | 'error'; text: string }>
>({});
  async function loadOrders() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${apiUrl}/api/orders/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudieron cargar tus compras.',
        );
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar tus compras.',
      );
    } finally {
      setLoading(false);
    }
  }

async function submitReceipt(
  orderId: number,
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const token = localStorage.getItem('accessToken');
  const file = receiptFiles[orderId];

  if (!token) {
    navigate('/login');
    return;
  }

  if (!file) {
    setReceiptMessages((current) => ({
      ...current,
      [orderId]: {
        type: 'error',
        text: 'Selecciona el comprobante de transferencia.',
      },
    }));
    return;
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    setReceiptMessages((current) => ({
      ...current,
      [orderId]: {
        type: 'error',
        text: 'Solo se permiten archivos JPG, PNG, WEBP o PDF.',
      },
    }));
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setReceiptMessages((current) => ({
      ...current,
      [orderId]: {
        type: 'error',
        text: 'El archivo no puede superar los 5 MB.',
      },
    }));
    return;
  }

  const formData = new FormData();
  formData.append('receipt', file);
  formData.append(
    'transferReference',
    transferReferences[orderId] ?? '',
  );
  formData.append(
    'customerNote',
    customerNotes[orderId] ?? '',
  );

  try {
    setUploadingOrderId(orderId);

    setReceiptMessages((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });

    const response = await fetch(
      `${apiUrl}/api/orders/${orderId}/payment-submissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message ??
              'No se pudo enviar el comprobante.',
      );
    }

    setReceiptFiles((current) => ({
      ...current,
      [orderId]: null,
    }));

    setReceiptMessages((current) => ({
      ...current,
      [orderId]: {
        type: 'success',
        text: data?.message ??
          'Comprobante enviado correctamente.',
      },
    }));

    await loadOrders();
  } catch (err) {
    setReceiptMessages((current) => ({
      ...current,
      [orderId]: {
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al enviar el comprobante.',
      },
    }));
  } finally {
    setUploadingOrderId(null);
  }
}

  useEffect(() => {
    void loadOrders();
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Volver al inicio"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <h1 className="text-lg font-black text-slate-900">
              Mis compras
            </h1>
            <p className="text-xs text-slate-500">
              Consulta tus pedidos y su estado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary-deep p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <ShoppingBag size={25} />
            </div>
            <div>
              <h2 className="text-xl font-black">
                Tu historial de compras
              </h2>
              <p className="mt-1 text-sm text-primary-light">
                Revisa tus promociones y el avance de cada pedido.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <p className="text-sm text-slate-500">
              Cargando tus compras...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-bold text-red-700">
              No pudimos cargar tus compras
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Package size={26} />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-900">
              Aún no tienes compras
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Cuando compres una promoción, podrás consultar aquí
              los detalles y el estado de tu pedido.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
            >
              Explorar promociones
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-500">
              {orders.length}{' '}
              {orders.length === 1 ? 'pedido' : 'pedidos'}
            </p>

            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {order.business.logo ? (
                      <img
                        src={order.business.logo}
                        alt=""
                        className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Package size={23} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-900">
                        {order.business.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.reference}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString(
                          'es-BO',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.status)}`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                      {order.fulfillmentType === 'DELIVERY'
                        ? 'A mi puerta'
                        : 'Paso a recogerlo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.promotionTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Cantidad: {item.quantity} ×{' '}
                          {formatMoney(item.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-800">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </div>
                  ))}

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      {order.fulfillmentType === 'DELIVERY'
                        ? `Dirección: ${order.deliveryAddress || 'No disponible'}`
                        : `Sucursal: ${order.branch?.name || 'No disponible'}`}
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
<p className="text-xs text-slate-500">
  Estado del pago:{' '}
  <span className="font-bold text-slate-700">
    {getPaymentLabel(
      order.payment?.status,
      order.payment?.paymentMethod,
    )}
  </span>
</p>

{order.payment?.paymentMethod && (
  <p className="mt-1 text-xs text-slate-500">
    Método de pago:{' '}
    <span className="font-semibold text-slate-700">
      {order.payment.paymentMethod === 'TRANSFER'
        ? 'Transferencia bancaria'
        : 'Efectivo en sucursal'}
    </span>
  </p>
)}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Total del pedido
                        </p>
                        <p className="text-lg font-black text-accent">
                          {formatMoney(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                 
                  {/* Formulario para enviar el comprobante */}
                  {order.payment?.paymentMethod === 'TRANSFER' &&
                    ['PENDING', 'REJECTED'].includes(
                      order.payment.status,
                    ) &&
                    ![
                      'CONFIRMED',
                      'COMPLETED',
                      'CANCELLED',
                    ].includes(order.status) && (
                      <form
                        onSubmit={(event) =>
                          void submitReceipt(order.id, event)
                        }
                        className="space-y-4 border-t border-slate-100 p-4 sm:p-5"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900">
                            Enviar comprobante de transferencia
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Adjunta una imagen o un PDF de tu comprobante.
                            El archivo no debe superar los 5 MB.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor={`receipt-${order.id}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Comprobante *
                          </label>

                          <input
                            id={`receipt-${order.id}`}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            required
                            onChange={(event) => {
                              const file =
                                event.target.files?.[0] ?? null;

                              setReceiptFiles((current) => ({
                                ...current,
                                [order.id]: file,
                              }));
                            }}
                            className="block w-full rounded-xl border border-slate-200 p-3 text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`reference-${order.id}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Número de referencia (opcional)
                          </label>

                          <input
                            id={`reference-${order.id}`}
                            type="text"
                            maxLength={100}
                            value={transferReferences[order.id] ?? ''}
                            onChange={(event) =>
                              setTransferReferences((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            placeholder="Ej. número de operación"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`note-${order.id}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Nota adicional (opcional)
                          </label>

                          <textarea
                            id={`note-${order.id}`}
                            maxLength={500}
                            rows={2}
                            value={customerNotes[order.id] ?? ''}
                            onChange={(event) =>
                              setCustomerNotes((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            placeholder="Si necesitas aclarar algo sobre el pago..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                          />
                        </div>

                        {receiptMessages[order.id] && (
                          <p
                            role="status"
                            className={`text-sm font-semibold ${
                              receiptMessages[order.id].type === 'success'
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }`}
                          >
                            {receiptMessages[order.id].text}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={uploadingOrderId === order.id}
                          className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {uploadingOrderId === order.id
                            ? 'Enviando comprobante...'
                            : 'Enviar comprobante'}
                        </button>
                      </form>
                    )}

              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
