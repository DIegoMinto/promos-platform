import { useEffect, useState } from 'react';

import { useAuth } from '../../context/useAuth';

interface Summary {
  total: number;
  active: number;
  expiringSoon: number;
  categories: number;
}


interface SubscriptionPlan {
  code: string;
  name: string;
  monthlyPrice: number | string;
  promotionLimit: number | null;
}

interface SubscriptionInfo {
  subscription: {
    startDate: string;
    endDate: string;
  } | null;

  pendingRequest: {
    id: number;
    status: string;
    plan: SubscriptionPlan;
  } | null;

  plan: SubscriptionPlan;

  promotionUsage: {
    used: number;
    limit: number | null;
    remaining: number | null;
  };
}


export default function DashboardOverview() {
  const { accessToken, user } = useAuth();

  const [summary, setSummary] = useState<Summary>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    categories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);

  const [subscriptionLoading, setSubscriptionLoading] =
    useState(true);

  const [subscriptionError, setSubscriptionError] =
    useState('');


  useEffect(() => {
    async function loadSummary() {
      if (!accessToken) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/promotions/summary`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            'No se pudo cargar el resumen',
          );
        }

        const data: Summary = await response.json();

        setSummary(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar el resumen',
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [accessToken]);

  
useEffect(() => {
  async function loadSubscription() {
    if (!accessToken) {
      setSubscriptionLoading(false);
      return;
    }

    try {
      setSubscriptionLoading(true);
      setSubscriptionError('');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/subscriptions/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          'No se pudo cargar la información de tu plan',
        );
      }

      const data: SubscriptionInfo = await response.json();

      setSubscriptionInfo(data);
    } catch (error) {
      setSubscriptionError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar tu plan',
      );
    } finally {
      setSubscriptionLoading(false);
    }
  }

  loadSubscription();
}, [accessToken]);


  const cards = [
    {
      title: 'Promociones',
      value: summary.total,
      description: 'Total registradas',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m20.25 7.5-8.25-4.5-8.25 4.5m16.5 0v9L12 21l-8.25-4.5v-9m16.5 0L12 12m0 0L3.75 7.5M12 12v9"
          />
        </svg>
      ),
    },
    {
      title: 'Activas',
      value: summary.active,
      description: 'Promociones vigentes',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"
          />
        </svg>
      ),
    },
    {
      title: 'Por vencer',
      value: summary.expiringSoon,
      description: 'Durante los próximos 7 días',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      title: 'Categorías',
      value: summary.categories,
      description: 'Utilizadas en promociones',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 3.75H6.75A2.25 2.25 0 0 0 4.5 6v2.25A2.25 2.25 0 0 0 6.75 10.5H9a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 9 3.75Zm8.25 0H15A2.25 2.25 0 0 0 12.75 6v2.25A2.25 2.25 0 0 0 15 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25ZM9 13.5H6.75a2.25 2.25 0 0 0-2.25 2.25V18a2.25 2.25 0 0 0 2.25 2.25H9A2.25 2.25 0 0 0 11.25 18v-2.25A2.25 2.25 0 0 0 9 13.5Zm8.25 0H15a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 15 20.25h2.25A2.25 2.25 0 0 0 19.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Panel de negocio
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Hola, {user?.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Aquí tienes un resumen de tus promociones.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      
{/* PLAN Y USO DE PROMOCIONES */}
<section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-sm font-medium text-primary">
        Tu suscripción
      </p>

      <h2 className="mt-1 text-2xl font-bold text-slate-900">
        {subscriptionLoading
          ? 'Cargando plan...'
          : subscriptionInfo?.plan.name ?? 'Plan no disponible'}
      </h2>

      {!subscriptionLoading && subscriptionInfo && (
        <p className="mt-1 text-sm text-slate-500">
          {Number(subscriptionInfo.plan.monthlyPrice) === 0
            ? 'Plan gratuito'
            : `Bs ${Number(subscriptionInfo.plan.monthlyPrice).toFixed(2)} / mes`}
        </p>
      )}
    </div>

    {!subscriptionLoading && subscriptionInfo && (
      <div className="rounded-xl bg-primary-soft px-4 py-3">
        <p className="text-xs font-medium text-primary">
          {subscriptionInfo.subscription
            ? 'Suscripción activa'
            : 'Plan actual'}
        </p>

        {subscriptionInfo.subscription && (
          <p className="mt-1 text-sm text-slate-700">
            Vence el{' '}
            {new Date(
              subscriptionInfo.subscription.endDate,
            ).toLocaleDateString('es-BO')}
          </p>
        )}
      </div>
    )}
  </div>

  {subscriptionLoading ? (
    <p className="mt-6 text-sm text-slate-500">
      Consultando uso de promociones...
    </p>
  ) : subscriptionInfo ? (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">
          Promociones utilizadas
        </p>

        <p className="text-sm font-bold text-slate-900">
          {subscriptionInfo.promotionUsage.used}
          {' / '}
          {subscriptionInfo.promotionUsage.limit ?? '∞'}
        </p>
      </div>

      {subscriptionInfo.promotionUsage.limit !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.min(
                100,
                (subscriptionInfo.promotionUsage.used /
                  Math.max(
                    1,
                    subscriptionInfo.promotionUsage.limit,
                  )) *
                  100,
              )}%`,
            }}
          />
        </div>
      )}

      <p className="mt-2 text-sm text-slate-500">
        {subscriptionInfo.promotionUsage.remaining === null
          ? 'Tu plan no tiene un límite numérico configurado.'
          : subscriptionInfo.promotionUsage.remaining === 0
            ? 'Has alcanzado el límite de tu plan.'
            : `Te quedan ${subscriptionInfo.promotionUsage.remaining} promociones disponibles.`}
      </p>

      {subscriptionInfo.pendingRequest && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Tienes una solicitud del plan{' '}
          <strong>
            {subscriptionInfo.pendingRequest.plan.name}
          </strong>{' '}
          pendiente de revisión.
        </p>
      )}
    </div>
  ) : (
    <p className="mt-4 text-sm text-red-600">
      {subscriptionError || 'No se pudo cargar tu plan.'}
    </p>
  )}
</section>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? '—' : card.value}
                </p>
              </div>

              <div className="rounded-xl bg-primary-soft p-3 text-primary">
                {card.icon}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Estado de tus promociones
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Mantén tus promociones actualizadas para que los
          clientes encuentren ofertas vigentes.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {loading ? '—' : summary.total}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Vigentes
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-700">
              {loading ? '—' : summary.active}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">
              Por vencer
            </p>

            <p className="mt-1 text-xl font-bold text-red-600">
              {loading ? '—' : summary.expiringSoon}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}