import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Search,
  ShoppingBag,
  Tag,
  MapPin,
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
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
              className="text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:text-[#E31E24]"
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={scrollToPromotions}
              className="text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:text-[#E31E24]"
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
              className="text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:text-[#E31E24]"
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

                    <p className="text-[11px] font-semibold text-[#1D52A0]">
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
                      className="rounded-lg border-2 border-[#1D52A0] px-3 py-1.5 text-xs font-bold text-[#1D52A0] transition hover:bg-[#1D52A0] hover:text-white"
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
                      className="rounded-lg border-2 border-[#1D52A0] px-3 py-1.5 text-xs font-bold text-[#1D52A0] transition hover:bg-[#1D52A0] hover:text-white"
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
                      className="rounded-lg border-2 border-[#1D52A0] px-3 py-1.5 text-xs font-bold text-[#1D52A0] transition hover:bg-[#1D52A0] hover:text-white"
                    >
                      ADMIN
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border-2 border-[#E31E24] px-3 py-1.5 text-xs font-bold text-[#E31E24] transition hover:bg-[#E31E24] hover:text-white"
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
                    className="rounded-lg border-2 border-[#1D52A0] px-3 py-1.5 text-xs font-bold text-[#1D52A0] transition hover:bg-[#1D52A0] hover:text-white"
                  >
                    INICIAR SESIÓN
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/register')
                    }
                    className="rounded-lg bg-[#E31E24] px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    REGÍSTRATE
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="flex md:hidden">
            {user ? (
              <button
                type="button"
                onClick={() => {
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
                className="rounded-lg bg-[#1D52A0] px-3 py-2 text-xs font-bold text-white"
              >
                MI CUENTA
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  navigate('/login')
                }
                className="rounded-lg bg-[#1D52A0] px-3 py-2 text-xs font-bold text-white"
              >
                INGRESAR
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#1D52A0] to-blue-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-100">
                <Tag size={14} />
                Promociones en Bolivia
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                DESCUBRE GRANDES
                <br />
                <span className="text-red-400">
                  PROMOCIONES
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
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
                  className="shrink-0 rounded-full bg-[#E31E24] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 sm:px-6"
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
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">
              Explora por categoría
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Encuentra promociones según lo que
              buscas.
            </p>
          </div>

          {loadingCategories ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
              Cargando categorías...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center">
              <p className="text-sm font-semibold text-slate-600">
                No hay categorías disponibles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* TODAS */}
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory(null)
                }
                className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all hover:-translate-y-1 ${
                  selectedCategory === null
                    ? 'border-[#1D52A0] bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    selectedCategory === null
                      ? 'bg-white text-[#1D52A0]'
                      : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <ShoppingBag size={22} />
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Todas
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Todas las promociones
                </p>
              </button>

              {categories.map((category) => {
                const isSelected =
                  selectedCategory ===
                  category.id;

                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() =>
                      setSelectedCategory(
                        category.id,
                      )
                    }
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all hover:-translate-y-1 ${
                      isSelected
                        ? 'border-[#E31E24] bg-red-50 shadow-md'
                        : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-white text-[#E31E24]'
                          : 'bg-slate-50 text-[#1D52A0]'
                      }`}
                    >
                      {getCategoryIcon(
                        category,
                      )}
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900">
                      {category.name}
                    </h3>

                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                      {category.description ||
                        'Descubre promociones'}
                    </p>
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
                className="self-start text-xs font-bold text-[#1D52A0] hover:underline sm:self-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  className="mt-4 rounded-lg bg-[#1D52A0] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
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
                        navigate(
                          `/promociones/${promotion.id}`,
                        )
                      }
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={
                            promotion.image ||
                            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=500'
                          }
                          alt={
                            promotion.title
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        {discountPercentage >
                          0 && (
                          <span className="absolute right-3 top-3 rounded-md bg-[#E31E24] px-2.5 py-1 text-xs font-black text-white shadow-md">
                            {discountPercentage}%
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D52A0]">
                          {
                            promotion
                              .category
                              .name
                          }
                        </span>

                        <h3 className="mt-1 line-clamp-1 text-base font-bold text-slate-900">
                          {
                            promotion.title
                          }
                        </h3>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin
                            size={14}
                            className="shrink-0"
                          />

                          <span className="line-clamp-1">
                            {
                              promotion
                                .business
                                .name
                            }

                            {promotion
                              .business
                              .city
                              ? ` • ${promotion.business.city}`
                              : ''}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-[#E31E24]">
                              Bs.{' '}
                              {discountPrice.toFixed(
                                2,
                              )}
                            </span>

                            {originalPrice >
                              discountPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                Bs.{' '}
                                {originalPrice.toFixed(
                                  2,
                                )}
                              </span>
                            )}
                          </div>

                          <ArrowRight
                            size={18}
                            className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1D52A0]"
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
      <footer className="border-t border-slate-200 bg-[#1D52A0] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Tag size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-100">
                Grandes descuentos
              </h4>

              <p className="mt-1 text-xs text-blue-200">
                Encuentra ofertas que valen la pena.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Building2 size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-100">
                Negocios locales
              </h4>

              <p className="mt-1 text-xs text-blue-200">
                Descubre promociones de negocios.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <MapPin size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-100">
                Cerca de ti
              </h4>

              <p className="mt-1 text-xs text-blue-200">
                Encuentra dónde aprovecharlas.
              </p>
            </div>

            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <ShoppingBag size={19} />
              </div>

              <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-100">
                Todo en un lugar
              </h4>

              <p className="mt-1 text-xs text-blue-200">
                Explora promociones fácilmente.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-center">
            <p className="text-[11px] text-blue-200">
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