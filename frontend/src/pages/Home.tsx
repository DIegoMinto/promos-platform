import { useAuth } from '../contexts/AuthContext';

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UtensilsIcon = () => (
  <svg className="w-6 h-6 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 3v4a2 2 0 01-2 2H7a2 2 0 01-2-2V3m4 0v6m6-6v6" />
  </svg>
);

const HotelIcon = () => (
  <svg className="w-6 h-6 text-[#1D52A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-6 h-6 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2 2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2 2 2 0 002-2V7a2 2 0 00-2-2H5z" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg className="w-6 h-6 text-[#1D52A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CompassIcon = () => (
  <svg className="w-6 h-6 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface HomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

function Home({ onLogin, onRegister }: HomeProps) {

    const { user, logout } = useAuth();


  const categories = [
    { name: 'Restaurantes', subtitle: 'Los mejores sabores', icon: <UtensilsIcon /> },
    { name: 'Hoteles', subtitle: 'Descanso y confort', icon: <HotelIcon /> },
    { name: 'Entretenimiento', subtitle: 'Diversión sin límites', icon: <TicketIcon /> },
    { name: 'Turismo', subtitle: 'Aventuras únicas', icon: <CompassIcon /> },
    { name: 'Compras', subtitle: 'Las mejores ofertas', icon: <ShoppingBagIcon /> },
  ];

  const promotions = [
    {
      title: 'Concierto Los Kjarkas',
      business: '25 de Mayo • La Paz',
      category: 'Entretenimiento',
      price: 'Bs. 120',
      oldPrice: 'Bs. 150',
      discount: '20% OFF',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500',
    },
    {
      title: 'Restaurante Gustu',
      business: 'Menú Degustación • La Paz',
      category: 'Restaurantes',
      price: 'Bs. 210',
      oldPrice: 'Bs. 300',
      discount: '30% OFF',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500',
    },
    {
      title: 'Hotel Casa Grande',
      business: 'Escapada de Lujo • Santa Cruz',
      category: 'Hoteles',
      price: 'Bs. 450',
      oldPrice: 'Bs. 600',
      discount: '25% OFF',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=500',
    },
    {
      title: 'Tour al Salar de Uyuni',
      business: 'Experiencia Full Day • Potosí',
      category: 'Turismo',
      price: 'Bs. 280',
      oldPrice: 'Bs. 330',
      discount: '15% OFF',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          <div className="flex items-center gap-3">
    
          <img 
            src="/logo.jpg" 
            alt="Promo Bolivia Logo" 
            className="h-12 w-auto object-contain" 
          />
        </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#E31E24]">
              Inicio
            </a>
            <a href="#" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#E31E24]">
              Eventos
            </a>
            <a href="#" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#E31E24]">
              Categorías
            </a>
            <a href="#" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#E31E24]">
              Promociones
            </a>

            <div className="flex items-center gap-3">
  {user ? (
    <>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-gray-800">
          {user.name}
        </p>

        <p className="text-xs font-semibold text-[#1D52A0]">
          {user.role}
        </p>
      </div>

      <button
        onClick={logout}
        className="rounded-lg border-2 border-[#E31E24] px-4 py-1.5 text-xs font-bold text-[#E31E24] transition hover:bg-[#E31E24] hover:text-white"
      >
        CERRAR SESIÓN
      </button>
    </>
  ) : (
    <>
      <button
        onClick={onLogin}
        className="rounded-lg border-2 border-[#1D52A0] px-4 py-1.5 text-xs font-bold text-[#1D52A0] transition hover:bg-[#1D52A0] hover:text-white"
      >
        INICIAR SESIÓN
      </button>

      <button
  onClick={onRegister}
  className="rounded-lg bg-[#E31E24] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
>
  REGÍSTRATE
</button>
    </>
  )}
</div>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-r from-[#1D52A0] to-blue-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black tracking-tight leading-tight md:text-5xl">
                DESCUBRE, AHORRA <br />
                <span className="text-red-400">Y DISFRUTA MÁS</span>
              </h1>
              <p className="mt-4 text-base text-blue-100">
                Tu app para eventos, experiencias y descuentos exclusivos en Bolivia.
              </p>

              <div className="mt-8 flex items-center rounded-full bg-white p-1.5 shadow-xl">
                <div className="pl-4 pr-2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="¿Qué estás buscando hoy?"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button className="rounded-full bg-[#E31E24] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-red-700">
                  BUSCAR
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {['Conciertos', 'Restaurantes', 'Hoteles', 'Turismo'].map((tag) => (
                  <span key={tag} className="cursor-pointer rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  {cat.icon}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{cat.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">{cat.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Eventos y Promociones Destacadas</h2>
              <p className="text-xs text-slate-500">Aprovecha los descuentos activos del mes</p>
            </div>
            <a href="#" className="text-xs font-bold text-[#1D52A0] hover:underline">
              Ver todas &rarr;
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {promotions.map((promo) => (
              <article
                key={promo.title}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 right-3 rounded-md bg-[#E31E24] px-2.5 py-1 text-xs font-black text-white shadow-md">
                    {promo.discount}
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D52A0]">
                    {promo.category}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900 line-clamp-1">
                    {promo.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <LocationIcon />
                    <span className="line-clamp-1">{promo.business}</span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2 border-t border-slate-100 pt-3">
                    <span className="text-lg font-black text-[#E31E24]">{promo.price}</span>
                    <span className="text-xs text-slate-400 line-through">{promo.oldPrice}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#1D52A0] py-6 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:grid-cols-4 text-center">
          <div className="p-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Pagos 100% seguros</h4>
          </div>
          <div className="p-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Entradas digitales</h4>
          </div>
          <div className="p-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Atención personalizada</h4>
          </div>
          <div className="p-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Promociones verificadas</h4>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;