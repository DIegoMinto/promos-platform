import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Search,
  ShoppingBag,
  Tag,
  MapPin,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { categoryIcons } from '../constants/categoryIcons';

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
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingPromotions, setLoadingPromotions] =
    useState(true);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [promotionsError, setPromotionsError] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPromotions() {
      try {
        setLoadingPromotions(true);
        setPromotionsError('');

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/promotions`,
        );

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar las promociones',
          );
        }

        const data: Promotion[] =
          await response.json();

        if (!cancelled) {
          setPromotions(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setPromotionsError(
            'No se pudieron cargar las promociones.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPromotions(false);
        }
      }
    }

    fetchPromotions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        setLoadingCategories(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/categories`,
        );

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar las categorías',
          );
        }

        const data: Category[] =
          await response.json();

        if (!cancelled) {
          setCategories(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearchTerm =
    searchTerm.trim().toLowerCase();

  const filteredPromotions =
    promotions.filter((promotion) => {
      const matchesCategory =
        selectedCategory === null ||
        promotion.category.id === selectedCategory;

      const matchesSearch =
        normalizedSearchTerm === '' ||
        promotion.title
          .toLowerCase()
          .includes(normalizedSearchTerm) ||
        (promotion.description ?? '')
          .toLowerCase()
          .includes(normalizedSearchTerm) ||
        promotion.business.name
          .toLowerCase()
          .includes(normalizedSearchTerm) ||
        (promotion.business.city ?? '')
          .toLowerCase()
          .includes(normalizedSearchTerm) ||
        promotion.category.name
          .toLowerCase()
          .includes(normalizedSearchTerm);

      return matchesCategory && matchesSearch;
    });

  const selectedCategoryName =
    selectedCategory === null
      ? 'Todas las promociones'
      : categories.find(
          (category) =>
            category.id === selectedCategory,
        )?.name ?? 'Promociones';

  function scrollToPromotions() {
    document
      .getElementById('promociones')
      ?.scrollIntoView({
        behavior: 'smooth',
      });
  }

  function getCategoryIcon(category: Category) {
    const Icon =
      categoryIcons[category.icon ?? ''];

    if (Icon) {
      return <Icon size={22} />;
    }

    return <Tag size={22} />;
  }

  function getDiscountPercentage(
    originalPrice: number,
    discountPrice: number,
  ) {
    if (originalPrice <= 0) {
      return 0;
    }

    return Math.round(
      ((originalPrice - discountPrice) /
        originalPrice) *
        100,
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0"
            aria-label="Ir al inicio"
          >
            <img
              src="/logo.jpg"
              alt="Promos Platform"
              className="h-11 w-auto object-contain"
            />
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:text-accent"
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={scrollToPromotions}
              className="text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:text-accent"
            >
              Promociones
            </button>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById('categorias')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  });
              }}
              className="text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:text-accent"
            >
              Categorías
            </button>

            <div className="ml-2 flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden text-right lg:block">
                    <p className="max-w-32 truncate text-sm font-bold text-slate-800">
                      {user.name}
                    </p>

                    <p className="text-[11px] font-semibold text-primary">
                      {user.role === 'CLIENTE'
                        ? 'Cliente'
                        : user.role === 'NEGOCIO'
                          ? 'Negocio'
                          : 'Administrador'}
                    </p>
                  </div>

                  {user.role === 'CLIENTE' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/perfil')
                      }
                      className="rounded-lg border-2 border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      MI PERFIL
                    </button>
                  )}

                  {user.role === 'NEGOCIO' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/negocio')
                      }
                      className="rounded-lg border-2 border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      MI NEGOCIO
                    </button>
                  )}

                  {user.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/admin')
                      }
                      className="rounded-lg border-2 border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      ADMIN
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border-2 border-accent px-3 py-1.5 text-xs font-bold text-accent transition hover:bg-accent hover:text-white"
                  >
                    SALIR
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/login')
                    }
                    className="rounded-lg border-2 border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    INICIAR SESIÓN
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/register')
                    }
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white transition hover:bg-accent-dark"
                  >
                    REGÍSTRATE
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((open) => !open)
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-primary transition hover:bg-slate-50"
              aria-label={
                mobileMenuOpen
                  ? 'Cerrar menú'
                  : 'Abrir menú'
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  {user ? (
                    <>
                      <p className="truncate text-sm font-bold text-slate-800">
                        {user.name}
                      </p>

                      <p className="mt-0.5 text-[11px] font-semibold text-primary">
                        {user.role === 'CLIENTE'
                          ? 'Cliente'
                          : user.role === 'NEGOCIO'
                            ? 'Negocio'
                            : 'Administrador'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-800">
                      Promos Platform
                    </p>
                  )}
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-primary-soft hover:text-primary"
                  >
                    Inicio
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      scrollToPromotions();
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-primary-soft hover:text-primary"
                  >
                    Promociones
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById('categorias')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                        });
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-primary-soft hover:text-primary"
                  >
                    Categorías
                  </button>

                  <div className="my-2 border-t border-slate-100" />

                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);

                          if (user.role === 'CLIENTE') {
                            navigate('/perfil');
                            return;
                          }

                          if (user.role === 'NEGOCIO') {
                            navigate('/negocio');
                            return;
                          }

                          navigate('/admin');
                        }}
                        className="flex w-full items-center rounded-xl bg-primary-soft px-3 py-3 text-left text-sm font-bold text-primary transition hover:bg-primary-light"
                      >
                        {user.role === 'CLIENTE'
                          ? 'Mi perfil'
                          : user.role === 'NEGOCIO'
                            ? 'Mi negocio'
                            : 'Administración'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="mt-2 flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-accent transition hover:bg-accent-soft"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/login');
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-primary transition hover:bg-primary-soft"
                      >
                        Iniciar sesión
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/register');
                        }}
                        className="mt-2 flex w-full items-center rounded-xl bg-accent px-3 py-3 text-left text-sm font-bold text-white transition hover:bg-accent-dark"
                      >
                        Regístrate
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-deep py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-light">
                <Tag size={14} />
                Promociones en Bolivia
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Las mejores
                <br />
                <br />
                <span className="bg-accent text-white rounded-2xl p-2">
                  promos
                </span>
                <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                  de Bolivia
                </h1>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-primary-light sm:text-lg">
                Encuentra ofertas, descuentos y
                promociones de tus negocios
                favoritos en un solo lugar.
              </p>

              {/* BUSCADOR */}
              <div className="mt-8 flex items-center rounded-full bg-white p-1.5 shadow-xl">
                <div className="pl-4 pr-2">
                  <Search
                    size={20}
                    className="text-slate-400"
                  />
                </div>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      scrollToPromotions();
                    }
                  }}
                  placeholder="¿Qué promoción estás buscando?"
                  className="w-full bg-transparent px-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={scrollToPromotions}
                  className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white transition hover:bg-accent-dark sm:px-6"
                >
                  BUSCAR
                </button>
              </div>

              {/* BÚSQUEDAS RÁPIDAS */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Restaurantes',
                  'Hoteles',
                  'Compras',
                  'Turismo',
                ].map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => {
                      setSearchTerm(tag);
                      scrollToPromotions();
                    }}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

                {/* CATEGORÍAS */}
        <section
          id="categorias"
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-black text-slate-900">
              Explora por categoría
            </h2>
          </div>

          {loadingCategories ? (
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex w-20 shrink-0 flex-col items-center gap-2"
                >
                  <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay categorías disponibles.
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
              {/* TODAS */}
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory(null)
                }
                aria-pressed={selectedCategory === null}
                className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
                    selectedCategory === null
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-slate-200 bg-white text-primary group-hover:border-primary-light group-hover:bg-primary-soft'
                  }`}
                >
                  <ShoppingBag size={22} />
                </div>

                <span
                  className={`line-clamp-2 text-xs font-semibold leading-tight ${
                    selectedCategory === null
                      ? 'text-primary'
                      : 'text-slate-600'
                  }`}
                >
                  Todas
                </span>
              </button>

              {categories.map((category) => {
                const isSelected =
                  selectedCategory === category.id;

                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() =>
                      setSelectedCategory(category.id)
                    }
                    aria-pressed={isSelected}
                    className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
                        isSelected
                          ? 'border-accent bg-accent text-white shadow-md'
                          : 'border-slate-200 bg-white text-primary group-hover:border-primary-light group-hover:bg-primary-soft'
                      }`}
                    >
                      {getCategoryIcon(category)}
                    </div>

                    <span
                      className={`line-clamp-2 text-xs font-semibold leading-tight ${
                        isSelected
                          ? 'text-accent'
                          : 'text-slate-600'
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* PROMOCIONES */}
        <section
          id="promociones"
          className="mx-auto max-w-7xl px-4 pb-20 sm:px-6"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedCategoryName}
                </h2>

                {filteredPromotions.length >
                  0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                    {filteredPromotions.length}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {searchTerm.trim()
                  ? `Resultados para "${searchTerm}"`
                  : 'Aprovecha las mejores ofertas disponibles.'}
              </p>
            </div>

            {(selectedCategory !== null ||
              searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchTerm('');
                }}
                className="self-start text-xs font-bold text-primary hover:underline sm:self-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {loadingPromotions ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-14 text-center">
                <p className="text-sm text-slate-400">
                  Cargando promociones...
                </p>
              </div>
            ) : promotionsError ? (
              <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 py-14 text-center">
                <p className="text-sm font-semibold text-red-600">
                  {promotionsError}
                </p>

                <p className="mt-1 text-xs text-red-400">
                  Intenta nuevamente más tarde.
                </p>
              </div>
            ) : filteredPromotions.length ===
              0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={21} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  No encontramos promociones
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Prueba con otro término o
                  selecciona otra categoría.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(
                      null,
                    );
                    setSearchTerm('');
                  }}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark"
                >
                  LIMPIAR FILTROS
                </button>
              </div>
            ) : (
              filteredPromotions.map(
                (promotion) => {
                  const originalPrice =
                    Number(
                      promotion.originalPrice,
                    );

                  const discountPrice =
                    Number(
                      promotion.discountPrice,
                    );

                  const discountPercentage =
                    getDiscountPercentage(
                      originalPrice,
                      discountPrice,
                    );

                  return (
                    <article
  key={promotion.id}
  onClick={() =>
    navigate(`/promociones/${promotion.id}`)
  }
  className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
>
  <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-48">
    <img
      src={
        promotion.image ||
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=500'
      }
      alt={promotion.title}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />

    {discountPercentage > 0 && (
      <span className="absolute right-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-black text-white shadow-md sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
        {discountPercentage}% OFF
      </span>
    )}
  </div>

  <div className="p-3 sm:p-4">
    <span className="line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">
      {promotion.category.name}
    </span>

    <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-900 sm:text-base">
      {promotion.title}
    </h3>

    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 sm:mt-2 sm:gap-1.5 sm:text-xs">
      <MapPin
        size={12}
        className="shrink-0 sm:h-3.5 sm:w-3.5"
      />

      <span className="line-clamp-1">
        {promotion.business.name}
        {promotion.business.city
          ? ` • ${promotion.business.city}`
          : ''}
      </span>
    </div>

    <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2 sm:mt-4 sm:pt-3">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span className="text-base font-black leading-tight text-accent sm:text-lg">
          Bs. {discountPrice.toFixed(2)}
        </span>

        {originalPrice > discountPrice && (
          <span className="text-[11px] text-slate-400 line-through sm:text-xs">
            Bs. {originalPrice.toFixed(2)}
          </span>
        )}
      </div>

      <ArrowRight
        size={18}
        className="hidden text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary sm:block"
      />
    </div>
  </div>
</article>
                  );
                },
              )
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-primary py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Tag size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-light">
                Grandes descuentos
              </h4>

              <p className="mt-1 text-xs text-primary-light">
                Encuentra ofertas que valen la pena.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Building2 size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-light">
                Negocios locales
              </h4>

              <p className="mt-1 text-xs text-primary-light">
                Descubre promociones de negocios.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <MapPin size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-light">
                Cerca de ti
              </h4>

              <p className="mt-1 text-xs text-primary-light">
                Encuentra dónde aprovecharlas.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <ShoppingBag size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-light">
                Todo en un lugar
              </h4>

              <p className="mt-1 text-xs text-primary-light">
                Explora promociones fácilmente.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-center">
            <p className="text-[11px] text-primary-light">
              © {new Date().getFullYear()} Promos
              Platform. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;