
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number | string;
  promotionLimit: number | null;
  benefits: string[] | null;
}

interface SubscriptionInfo {
  subscription: {
    startDate: string;
    endDate: string;
  } | null;
  pendingRequest: {
    id: number;
    status: string;
    plan: Plan;
  } | null;
  plan: Plan;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function SubscriptionPlans() {
  const { accessToken } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const [plansResponse, infoResponse] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions/plans`),
        fetch(`${API_URL}/api/subscriptions/me`, { headers }),
      ]);

      if (!plansResponse.ok || !infoResponse.ok) {
        throw new Error('No se pudieron cargar los planes.');
      }

      const plansData: Plan[] = await plansResponse.json();
      const infoData: SubscriptionInfo = await infoResponse.json();

      setPlans(plansData);
      setInfo(infoData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar los planes.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRequest(plan: Plan) {
    if (plan.code === 'FREE' || requesting !== null) return;

    const confirmed = window.confirm(
      `¿Deseas solicitar el plan ${plan.name} por Bs ${Number(
        plan.monthlyPrice,
      ).toFixed(2)} al mes?`,
    );

    if (!confirmed) return;

    setRequesting(plan.id);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/subscriptions/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ planId: plan.id }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(
          detail || 'No se pudo enviar la solicitud.',
        );
      }

      setMessage('¡Solicitud enviada! Está pendiente de revisión.');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al solicitar el plan.',
      );
    } finally {
      setRequesting(null);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        Cargando planes...
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">{error}</p>
        <button
          onClick={() => void loadData()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-primary">
          TU NEGOCIO
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Planes y suscripción
        </h1>
        <p className="mt-2 text-slate-500">
          Elegí el plan que mejor se adapte a tu negocio.
        </p>
      </header>

      {info && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tu plan actual</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {info.plan.name}
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {info.subscription ? 'Suscripción activa' : 'Plan gratuito'}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {info.plan.promotionLimit === null
              ? 'Promociones activas ilimitadas'
              : `Hasta ${info.plan.promotionLimit} promociones activas`}
          </p>

          {info.subscription && (
            <p className="mt-1 text-sm text-slate-500">
              Vence el{' '}
              {new Date(info.subscription.endDate).toLocaleDateString(
                'es-BO',
              )}
            </p>
          )}

          {info.pendingRequest && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Tenés una solicitud pendiente para el plan{' '}
              <strong>{info.pendingRequest.plan.name}</strong>.
              El administrador debe revisarla antes de que puedas enviar otra.
            </div>
          )}
        </section>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = info?.plan.code === plan.code;
          const isFree = plan.code === 'FREE';
          const hasPending = Boolean(info?.pendingRequest);
          const benefits = Array.isArray(plan.benefits)
            ? plan.benefits
            : [];

          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                plan.code === 'FEATURED'
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-slate-200'
              }`}
            >
              {plan.code === 'FEATURED' && (
                <span className="mb-4 w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  MAYOR VISIBILIDAD
                </span>
              )}

              <h2 className="text-2xl font-black text-slate-900">
                {plan.name}
              </h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {plan.description}
              </p>

              <div className="mt-5">
                <span className="text-3xl font-black text-slate-900">
                  Bs {Number(plan.monthlyPrice).toFixed(2)}
                </span>
                <span className="text-sm text-slate-500">
                  {' '}/ mes
                </span>
              </div>

              <div className="my-6 h-px bg-slate-100" />

              <p className="font-semibold text-slate-800">
                {plan.promotionLimit === null
                  ? 'Promociones ilimitadas'
                  : `Hasta ${plan.promotionLimit} promociones activas`}
              </p>

              <ul className="mt-4 flex-1 space-y-3">
                {benefits.map((benefit, index) => (
                  <li
                    key={`${plan.id}-${index}`}
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="font-bold text-emerald-600">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={
                  isCurrent ||
                  isFree ||
                  hasPending ||
                  requesting !== null
                }
                onClick={() => void handleRequest(plan)}
                className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isCurrent || isFree || hasPending || requesting !== null
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-primary text-white hover:opacity-90'
                }`}
              >
                {isCurrent
                  ? 'Tu plan actual'
                  : isFree
                    ? 'Plan gratuito'
                    : hasPending
                      ? 'Solicitud pendiente'
                      : requesting === plan.id
                        ? 'Enviando solicitud...'
                        : 'Solicitar este plan'}
              </button>
            </article>
          );
        })}
      </section>

      <p className="text-sm leading-6 text-slate-500">
        Las solicitudes de cambio son revisadas por el administrador.
        La visibilidad adicional del plan Destacado se aplicará cuando
        estén implementados los espacios promocionales rotativos.
      </p>
    </div>
  );
}
