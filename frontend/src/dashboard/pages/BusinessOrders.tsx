
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  RefreshCw,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Store,
  Truck,
  CreditCard,
  Clock3,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_REVIEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

type FulfillmentType = 'DELIVERY' | 'PICKUP';
type PaymentMethod = 'TRANSFER' | 'CASH_ON_PICKUP';
type PaymentStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';


interface OrderItem {
  id: number;
  promotionId: number;
  promotionTitle: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

interface PaymentSubmission {
  id: number;
  receiptUrl: string;
  transferReference?: string | null;
  customerNote?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

interface OrderPayment {
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  qrImageUrl?: string | null;
  submissions?: PaymentSubmission[];
}

interface OrderBranch {
  id: number;
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
}

interface BusinessOrder {
  id: number;
  reference: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  subtotal: number | string;
  deliveryFee: number | string;
  total: number | string;
  createdAt: string;
  completedAt?: string | null;
  items: OrderItem[];
  payment?: OrderPayment | null;
  branch?: OrderBranch | null;
}

type StatusFilter = 'ALL' | OrderStatus;
type PaymentReviewStatus = 'APPROVED' | 'REJECTED';

const apiUrl = import.meta.env.VITE_API_URL;

const statusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAYMENT_REVIEW: 'Pago pendiente de verificación',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recoger',
  OUT_FOR_DELIVERY: 'En camino',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const statusStyles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
  PREPARING: 'bg-violet-50 text-violet-700 ring-violet-200',
  READY_FOR_PICKUP: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  COMPLETED: 'bg-green-50 text-green-700 ring-green-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  PAYMENT_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
};

function money(value: number | string) {
  return Number(value).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getNextStatus(order: BusinessOrder): OrderStatus | null {
  const isCashPickup =
    order.fulfillmentType === 'PICKUP' &&
    order.payment?.paymentMethod === 'CASH_ON_PICKUP';

  if (order.status === 'PENDING_PAYMENT') {
    return isCashPickup ? 'PREPARING' : null;
  }

  if (order.status === 'CONFIRMED') {
    return order.payment?.status === 'APPROVED'
      ? 'PREPARING'
      : null;
  }

  if (order.status === 'PREPARING') {
    if (!isCashPickup && order.payment?.status !== 'APPROVED') {
      return null;
    }

    return order.fulfillmentType === 'PICKUP'
      ? 'READY_FOR_PICKUP'
      : 'OUT_FOR_DELIVERY';
  }

  if (
    order.status === 'READY_FOR_PICKUP' ||
    order.status === 'OUT_FOR_DELIVERY'
  ) {
    if (!isCashPickup && order.payment?.status !== 'APPROVED') {
      return null;
    }

    return 'COMPLETED';
  }

  return null;
}

function paymentLabel(payment?: OrderPayment | null) {
  if (!payment) return 'Sin información de pago';

  return payment.paymentMethod === 'CASH_ON_PICKUP'
    ? 'Efectivo en sucursal'
    : 'Transferencia';
}


const paymentStatusLabel = (payment?: OrderPayment | null) => {
  if (!payment) return 'Sin información de pago';

  switch (payment.status) {
    case 'APPROVED':
      return 'Pago aprobado';

    case 'REJECTED':
      return 'Pago rechazado';

    case 'UNDER_REVIEW':
      return 'Comprobante enviado; pendiente de revisión';

    default:
      return payment.paymentMethod === 'TRANSFER'
        ? 'Esperando comprobante'
        : 'Pago pendiente';
  }
};


export default function BusinessOrders() {
  const { accessToken } = useAuth();

  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reviewingPaymentId, setReviewingPaymentId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError('Tu sesión ha expirado. Inicia sesión nuevamente.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiUrl}/api/business/orders`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.message === 'string'
            ? data.message
            : 'No se pudieron cargar los pedidos.',
        );
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar los pedidos.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(
    order: BusinessOrder,
    nextStatus: OrderStatus,
  ) {
    if (!accessToken) return;

    const actionLabel = statusLabels[nextStatus];

    if (
      !window.confirm(
        `¿Quieres cambiar el pedido ${order.reference} a "${actionLabel}"?`,
      )
    ) {
      return;
    }

    try {
      setUpdatingId(order.id);
      setError('');
      setNotice('');

      const response = await fetch(
        `${apiUrl}/api/business/orders/${order.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message ??
                'No se pudo actualizar el estado del pedido.',
        );
      }

      setNotice(
        `El pedido ${order.reference} ahora está: ${actionLabel}.`,
      );

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al actualizar el pedido.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePaymentReview(
    order: BusinessOrder,
    status: PaymentReviewStatus,
  ) {
    if (!accessToken) {
      setError('Tu sesión ha expirado. Inicia sesión nuevamente.');
      return;
    }

    const actionLabel =
      status === 'APPROVED' ? 'aprobar' : 'rechazar';

    if (
      !window.confirm(
        `¿Confirmas que deseas ${actionLabel} el pago del pedido ${order.reference}?`,
      )
    ) {
      return;
    }

    try {
      setReviewingPaymentId(order.id);
      setError('');
      setNotice('');

      const response = await fetch(
        `${apiUrl}/api/business/orders/${order.id}/payment`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message ??
                'No se pudo actualizar el pago.',
        );
      }

      setNotice(
        status === 'APPROVED'
          ? `Pago del pedido ${order.reference} aprobado correctamente.`
          : `Pago del pedido ${order.reference} rechazado.`,
      );

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al revisar el pago.',
      );
    } finally {
      setReviewingPaymentId(null);
    }
  }

  const visibleOrders =
    filter === 'ALL'
      ? orders
      : orders.filter((order) => order.status === filter);

const pendingCount = orders.filter(
  (order) =>
    order.status === 'PENDING_PAYMENT' ||
    order.status === 'PAYMENT_REVIEW' ||
    order.status === 'CONFIRMED',
).length;

  const activeCount = orders.filter(
    (order) =>
      order.status === 'PREPARING' ||
      order.status === 'READY_FOR_PICKUP' ||
      order.status === 'OUT_FOR_DELIVERY',
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === 'COMPLETED',
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">
            GESTIÓN DEL NEGOCIO
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Pedidos recibidos
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consulta tus ventas y gestiona el avance de cada pedido.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Actualizar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Pendientes"
          value={pendingCount}
          description="Esperando atención"
          icon={<Clock3 size={20} />}
        />

        <SummaryCard
          label="En proceso"
          value={activeCount}
          description="Preparación o entrega"
          icon={<ShoppingBag size={20} />}
        />

        <SummaryCard
          label="Completados"
          value={completedCount}
          description="Pedidos finalizados"
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-black text-slate-900">
              Todos los pedidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {visibleOrders.length}{' '}
              {visibleOrders.length === 1
                ? 'pedido encontrado'
                : 'pedidos encontrados'}
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as StatusFilter)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:w-64"
            aria-label="Filtrar pedidos por estado"
          >
            <option value="ALL">Todos los estados</option>

            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Cargando pedidos...
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ShoppingBag size={26} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              No hay pedidos para mostrar
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Cuando un cliente compre tus promociones, sus pedidos
              aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {visibleOrders.map((order) => {
              const isExpanded = expanded === order.id;
              const nextStatus = getNextStatus(order);

              const isCashPickup =
                order.fulfillmentType === 'PICKUP' &&
                order.payment?.paymentMethod === 'CASH_ON_PICKUP';

const canReviewPayment =
  order.payment?.paymentMethod === 'TRANSFER' &&
  order.payment.status === 'UNDER_REVIEW' &&
  order.status === 'PAYMENT_REVIEW';

              const reviewingThisPayment =
                reviewingPaymentId === order.id;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900">
                            {order.reference}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                              statusStyles[order.status] ??
                              'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                          >
                            {statusLabels[order.status] ?? order.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {order.customerName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.customerPhone}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {order.createdAt
                            ? formatDate(order.createdAt)
                            : 'Fecha no disponible'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-500">
                            Total del pedido
                          </p>

                          <p className="mt-1 text-xl font-black text-slate-900">
                            Bs. {money(order.total)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(isExpanded ? null : order.id)
                          }
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold text-primary hover:bg-slate-50"
                        >
                          {isExpanded ? 'Ocultar' : 'Detalles'}

                          {isExpanded ? (
                            <ChevronUp size={17} />
                          ) : (
                            <ChevronDown size={17} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                        {order.fulfillmentType === 'DELIVERY' ? (
                          <Truck size={15} />
                        ) : (
                          <Store size={15} />
                        )}

                        {order.fulfillmentType === 'DELIVERY'
                          ? 'Entrega a domicilio'
                          : 'Recojo en sucursal'}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                        <CreditCard size={15} />
                        {paymentLabel(order.payment)}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Productos
                          </h3>

                          <div className="mt-3 divide-y divide-slate-100">
                            {order.items?.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800">
                                    {item.promotionTitle}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.quantity} × Bs.{' '}
                                    {money(item.unitPrice)}
                                  </p>
                                </div>

                                <p className="shrink-0 text-sm font-bold text-slate-900">
                                  Bs. {money(item.lineTotal)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-4">
                            <h3 className="text-sm font-black text-slate-900">
                              {order.fulfillmentType === 'DELIVERY'
                                ? 'Dirección de entrega'
                                : 'Sucursal de recojo'}
                            </h3>

                            <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                              {order.fulfillmentType === 'DELIVERY' ? (
                                <Truck
                                  size={17}
                                  className="mt-0.5 shrink-0"
                                />
                              ) : (
                                <MapPin
                                  size={17}
                                  className="mt-0.5 shrink-0"
                                />
                              )}

                              <div>
                                {order.fulfillmentType === 'DELIVERY' ? (
                                  <>
                                    <p>
                                      {order.deliveryAddress ||
                                        'Sin dirección registrada'}
                                    </p>

                                    {order.deliveryNotes && (
                                      <p className="mt-2 text-xs">
                                        Referencias: {order.deliveryNotes}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-semibold">
                                      {order.branch?.name ??
                                        'Sucursal no disponible'}
                                    </p>

                                    <p className="mt-1">
                                      {order.branch?.address ?? ''}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <h3 className="text-sm font-black text-slate-900">
                              Información del pago
                            </h3>

                            <p className="mt-3 text-sm text-slate-700">
                              {paymentLabel(order.payment)}
                            </p>

                            <p
                              className={`mt-1 text-xs font-semibold ${
                                order.payment?.status === 'APPROVED'
                                  ? 'text-green-700'
                                  : order.payment?.status === 'REJECTED'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                              }`}
                            >
                              {paymentStatusLabel(order.payment)}
                            </p>

                            {order.payment?.paymentMethod === 'TRANSFER' &&
                              order.payment.qrImageUrl && (
                                <a
                                  href={order.payment.qrImageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-block text-sm font-bold text-primary underline"
                                >
                                  Ver QR de pago
                                </a>
                              )}

{order.payment?.paymentMethod === 'TRANSFER' && (
  <div className="mt-4 border-t border-slate-200 pt-4">
    <h4 className="text-sm font-black text-slate-900">
      Comprobante de transferencia
    </h4>

    {order.payment.submissions?.[0]?.receiptUrl ? (
      <>
        <a
          href={order.payment.submissions[0].receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-fit text-sm font-bold text-primary underline"
        >
          Abrir comprobante en tamaño completo
        </a>

        <a
          href={order.payment.submissions[0].receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <img
            src={order.payment.submissions[0].receiptUrl}
            alt="Comprobante de transferencia enviado por el cliente"
            className="max-h-80 w-full object-contain"
          />
        </a>

        {order.payment.submissions[0].transferReference && (
          <p className="mt-3 text-xs text-slate-600">
            Referencia:{' '}
            {order.payment.submissions[0].transferReference}
          </p>
        )}

        {order.payment.submissions[0].customerNote && (
          <p className="mt-2 text-xs text-slate-600">
            Nota del cliente:{' '}
            {order.payment.submissions[0].customerNote}
          </p>
        )}
      </>
    ) : (
      <p className="mt-2 text-sm text-amber-700">
        Todavía no hay un comprobante disponible para este pedido.
      </p>
    )}
  </div>
)}

                            {canReviewPayment && (
                              <div className="mt-4 space-y-3">
                                <p className="text-xs leading-5 text-slate-600">
                                  Verifica la transferencia antes de
                                  aprobar el pago y permitir que avance
                                  el pedido.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handlePaymentReview(
                                        order,
                                        'APPROVED',
                                      )
                                    }
                                    disabled={
                                      reviewingThisPayment ||
                                      updatingId === order.id
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {reviewingThisPayment ? (
                                      <RefreshCw
                                        size={15}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <CheckCircle2 size={15} />
                                    )}

                                    Aprobar pago
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handlePaymentReview(
                                        order,
                                        'REJECTED',
                                      )
                                    }
                                    disabled={
                                      reviewingThisPayment ||
                                      updatingId === order.id
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <XCircle size={15} />
                                    Rechazar pago
                                  </button>
                                </div>
                              </div>
                            )}

                            {order.payment?.status === 'REJECTED' && (
                              <p className="mt-3 text-xs leading-5 text-red-700">
                                El pago fue rechazado. El pedido no puede
                                avanzar hasta resolver el problema con el
                                pago.
                              </p>
                            )}

                            {isCashPickup && (
                              <p className="mt-3 text-xs leading-5 text-slate-600">
                                El cobro se realiza cuando el cliente
                                recoge el pedido.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs text-slate-500">
                              Subtotal: Bs. {money(order.subtotal)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Envío: Bs. {money(order.deliveryFee)}
                            </p>
                          </div>

                          {nextStatus ? (
                            <button
                              type="button"
                              onClick={() =>
                                void updateStatus(order, nextStatus)
                              }
                              disabled={
                                updatingId === order.id ||
                                reviewingThisPayment
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingId === order.id ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}

                              {updatingId === order.id
                                ? 'Actualizando...'
                                : `Marcar: ${statusLabels[nextStatus]}`}
                            </button>
                          ) : (
                            <p className="text-xs leading-5 text-slate-500 sm:max-w-64 sm:text-right">
                              {order.status === 'COMPLETED' ||
                              order.status === 'CANCELLED'
                                ? 'Este pedido ya no tiene acciones disponibles.'
                                : order.payment?.status === 'REJECTED'
                                  ? 'El pago fue rechazado. Debe resolverse antes de continuar.'
                                  : order.payment?.paymentMethod ===
                                        'TRANSFER' &&
                                      order.payment.status !== 'APPROVED'
                                    ? 'El pago debe estar aprobado antes de avanzar con este pedido.'
                                    : 'No hay una transición disponible para este estado.'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
