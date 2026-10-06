import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PromotionBranch {
  promotionId: number;
  branchId: number;
  branch: Branch;
}

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  originalPrice: number | string;
  discountPrice: number | string;
  startDate: string;
  endDate: string;

  category: {
    id: number;
    name: string;
  };

  business: {
    id: number;
    name: string;
    description: string | null;
    phone: string | null;
    logo: string | null;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };

  branches: PromotionBranch[];
}

const ArrowLeftIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.7 2.8a2 2 0 01-.45 1.82l-1.27 1.27a16 16 0 006.36 6.36l1.27-1.27a2 2 0 011.82-.45l2.8.7A2 2 0 0121 17.72V21a2 2 0 01-2 2h-1C9.716 23 3 16.284 3 8V5z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
    />
  </svg>
);

const BranchIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M9 10h.01M12 10h.01M15 10h.01"
    />
  </svg>
);

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [promotion, setPromotion] =
    useState<Promotion | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPromotion() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/promotions/${id}`,
        );

        if (!response.ok) {
          throw new Error(
            'No se pudo encontrar la promoción',
          );
        }

        const data: Promotion = await response.json();

        setPromotion(data);
      } catch (error) {
        console.error(error);

        setError(
          'La promoción no existe o ya no está disponible.',
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPromotion();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-400">
          Cargando promoción...
        </p>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">
          Promoción no disponible
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-primary px-5 py-3 text-xs font-bold text-white transition hover:bg-primary-dark"
        >
          VOLVER AL INICIO
        </button>
      </div>
    );
  }

  const originalPrice = Number(
    promotion.originalPrice,
  );

  const discountPrice = Number(
    promotion.discountPrice,
  );

  const discountPercentage =
    originalPrice > 0
      ? Math.round(
          ((originalPrice - discountPrice) /
            originalPrice) *
            100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-primary"
          >
            <ArrowLeftIcon />
            Volver
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[300px] bg-slate-100 lg:min-h-[560px]">
              <img
                src={
                  promotion.image ||
                  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000'
                }
                alt={promotion.title}
                className="h-full w-full object-cover"
              />

              <span className="absolute left-5 top-5 rounded-full bg-accent px-4 py-2 text-sm font-black text-white shadow-lg">
                {discountPercentage}% OFF
              </span>
            </div>

            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <span className="text-xs font-black uppercase tracking-widest text-primary">
                {promotion.category.name}
              </span>

              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                {promotion.title}
              </h1>

              <div className="mt-6 flex items-end gap-3">
                <span className="text-4xl font-black text-accent">
                  Bs. {discountPrice.toFixed(2)}
                </span>

                <span className="pb-1 text-lg text-slate-400 line-through">
                  Bs. {originalPrice.toFixed(2)}
                </span>
              </div>

              <div className="mt-8">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Sobre esta promoción
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {promotion.description ||
                    'Disfruta esta promoción especial.'}
                </p>
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                    <CalendarIcon />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Vigencia
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(
                        promotion.startDate,
                      )}
                    </p>

                    <p className="text-xs text-slate-500">
                      hasta{' '}
                      {formatDate(
                        promotion.endDate,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {promotion.branches &&
                promotion.branches.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <BranchIcon />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Disponible en
                        </p>

                        <h2 className="mt-1 text-xl font-black text-slate-900">
                          {promotion.branches.length === 1
                            ? '1 sucursal'
                            : `${promotion.branches.length} sucursales`}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {promotion.branches.map(
                        ({ branch }) => (
                          <div
                            key={branch.id}
                            className="rounded-xl bg-slate-50 p-4"
                          >
                            <h3 className="text-sm font-black text-slate-900">
                              {branch.name}
                            </h3>

                            <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                              <LocationIcon />

                              <div>
                                <p>
                                  {branch.address}
                                </p>

                                {branch.city && (
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {branch.city}
                                  </p>
                                )}
                              </div>
                            </div>

                            {branch.phone && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <PhoneIcon />
                                <span>
                                  {branch.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Negocio
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {promotion.business.name}
                </h2>

                {promotion.business.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {promotion.business.description}
                  </p>
                )}

                {promotion.business.city && (
                  <div className="mt-4 flex items-start gap-3 text-sm text-slate-600">
                    <LocationIcon />

                    <div>
                      <p className="font-semibold">
                        {promotion.business.city}
                      </p>

                      {promotion.business.address && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {promotion.business.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {promotion.business.phone && (
                  <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                    <PhoneIcon />

                    <span>
                      {promotion.business.phone}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-black text-white transition hover:bg-primary-dark"
              >
                VER MÁS PROMOCIONES
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PromotionDetail;