
import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface SubscriptionRequest {
  id: number;
  status: RequestStatus;
  monthlyPrice: number | string;
  message: string | null;
  adminNotes: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  business: {
    id: number;
    name?: string;
    businessName?: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  plan: {
    id: number;
    name: string;
    code: string;
    monthlyPrice: number | string;
  };
  reviewedBy?: {
    name: string;
  } | null;
}

const API_URL = import.meta.env.VITE_API_URL;

const filters: { label: string; value: RequestStatus }[] = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
];

const money = (value: number | string) =>
  `Bs ${Number(value).toFixed(2)}`;

const date = (value: string) =>
  new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function AdminSubscriptions() {
  const { accessToken } = useAuth();

  const [status, setStatus] = useState<RequestStatus>('PENDING');
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<SubscriptionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadRequests = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError('Tu sesión no está disponible. Inicia sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/subscription-requests?status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'No se pudieron cargar las solicitudes.',
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('El servidor devolvió un formato inesperado.');
      }

      setRequests(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar las solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, status]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function approveRequest(request: SubscriptionRequest) {
    const confirmed = window.confirm(
      `¿Aprobar el plan ${request.plan.name} para ${getBusinessName(request)}?`,
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/subscription-requests/${request.id}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo aprobar la solicitud.');
      }

      setNotice(`Solicitud #${request.id} aprobada correctamente.`);
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo aprobar la solicitud.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectRequest() {
    if (!rejecting) return;

    const reason = adminNotes.trim();

    if (!reason) {
      setError('Escribe el motivo del rechazo.');
      return;
    }

    setProcessingId(rejecting.id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/subscription-requests/${rejecting.id}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ adminNotes: reason }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo rechazar la solicitud.');
      }

      setNotice(`Solicitud #${rejecting.id} rechazada.`);
      setRejecting(null);
      setAdminNotes('');
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo rechazar la solicitud.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  function getBusinessName(request: SubscriptionRequest) {
    return (
      request.business.name ||
      request.business.businessName ||
      request.business.user?.name ||
      `Negocio #${request.business.id}`
    );
  }

  const pendingCount =
  status === 'PENDING' && !loading
    ? requests.length
    : '—';

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Suscripciones
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Revisa las solicitudes y gestiona los planes de los negocios.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-900">
              Solicitudes pendientes
            </p>
            <Clock3 size={20} className="text-amber-700" />
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-950">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-900">
              Solicitudes aprobadas
            </p>
            <CheckCircle2 size={20} className="text-emerald-700" />
          </div>
          <p className="mt-3 text-sm text-emerald-800">
            Consulta el historial con el filtro correspondiente.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-900">
              Solicitudes rechazadas
            </p>
            <XCircle size={20} className="text-red-700" />
          </div>
          <p className="mt-3 text-sm text-red-800">
            Revisa las observaciones registradas.
          </p>
        </div>
      </section>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setNotice('');
                setError('');
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === filter.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Cargando solicitudes...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardListPlaceholder />
            <h2 className="mt-4 font-semibold text-slate-900">
              No hay solicitudes {status === 'PENDING' ? 'pendientes' : status === 'APPROVED' ? 'aprobadas' : 'rechazadas'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuando existan solicitudes, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <article key={request.id} className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        SOLICITUD #{request.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          request.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : request.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status === 'PENDING'
                          ? 'Pendiente'
                          : request.status === 'APPROVED'
                            ? 'Aprobada'
                            : 'Rechazada'}
                      </span>
                    </div>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {getBusinessName(request)}
                    </h2>

                    {request.business.user?.email && (
                      <p className="mt-1 text-sm text-slate-500">
                        {request.business.user.email}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Plan solicitado
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {request.plan.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {money(request.monthlyPrice)} / mes
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Fecha de solicitud
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {date(request.requestedAt)}
                        </p>
                      </div>
                    </div>

                    {request.message && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">
                          Mensaje:
                        </span>{' '}
                        {request.message}
                      </p>
                    )}

                    {request.adminNotes && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-semibold">Observaciones:</span>{' '}
                        {request.adminNotes}
                      </p>
                    )}

                    {request.reviewedAt && (
                      <p className="mt-3 text-xs text-slate-400">
                        Revisada el {date(request.reviewedAt)}
                        {request.reviewedBy?.name
                          ? ` por ${request.reviewedBy.name}`
                          : ''}
                      </p>
                    )}
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => void approveRequest(request)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <Check size={16} />
                        {processingId === request.id ? 'Procesando...' : 'Aprobar'}
                      </button>

                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => {
                          setRejecting(request);
                          setAdminNotes('');
                          setError('');
                          setNotice('');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={16} />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="reject-title" className="text-lg font-bold text-slate-900">
                  Rechazar solicitud
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Solicitud #{rejecting.id} · {getBusinessName(rejecting)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <label
              htmlFor="adminNotes"
              className="mt-5 block text-sm font-medium text-slate-700"
            >
              Motivo del rechazo <span className="text-red-600">*</span>
            </label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Explica por qué no se puede aprobar esta solicitud..."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {adminNotes.length}/1000 caracteres
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                disabled={processingId !== null}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void rejectRequest()}
                disabled={!adminNotes.trim() || processingId !== null}
                className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === rejecting.id ? 'Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipboardListPlaceholder() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <Clock3 size={23} />
    </div>
  );
}
