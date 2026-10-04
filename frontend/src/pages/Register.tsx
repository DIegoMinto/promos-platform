import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type AccountType = 'CLIENTE' | 'NEGOCIO';

export default function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] =
    useState<AccountType>('CLIENTE');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [businessName, setBusinessName] =
    useState('');
  const [businessDescription, setBusinessDescription] =
    useState('');
  const [businessPhone, setBusinessPhone] =
    useState('');
  const [businessAddress, setBusinessAddress] =
    useState('');
  const [businessCity, setBusinessCity] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (
        accountType === 'NEGOCIO' &&
        !businessName.trim()
      ) {
        setError(
          'El nombre del negocio es obligatorio.',
        );
        setLoading(false);
        return;
      }

      const body = {
        name,
        email,
        password,
        role: accountType,

        ...(accountType === 'NEGOCIO'
          ? {
              businessName,
              businessDescription,
              businessPhone,
              businessAddress,
              businessCity,
            }
          : {}),
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo crear la cuenta.',
        );
      }

      setSuccess(
        'Cuenta creada correctamente. Redirigiendo al inicio de sesión...',
      );

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear la cuenta.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <img
              src="/logo.jpg"
              alt="Promo Bolivia"
              className="h-12 w-auto object-contain"
            />
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto flex max-w-3xl justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* TITLE */}
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#1D52A0]">
              Crea tu cuenta
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Únete a Promo Bolivia
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Elige el tipo de cuenta que quieres crear.
            </p>
          </div>

          {/* ACCOUNT TYPE */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* CLIENTE */}
            <button
              type="button"
              onClick={() =>
                setAccountType('CLIENTE')
              }
              className={`rounded-2xl border-2 p-5 text-left transition ${
                accountType === 'CLIENTE'
                  ? 'border-[#1D52A0] bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Cliente
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Descubre promociones, descuentos y
                    experiencias.
                  </p>
                </div>

                <div
                  className={`h-5 w-5 rounded-full border-2 ${
                    accountType === 'CLIENTE'
                      ? 'border-[#1D52A0] bg-[#1D52A0]'
                      : 'border-slate-300'
                  }`}
                />
              </div>
            </button>

            {/* NEGOCIO */}
            <button
              type="button"
              onClick={() =>
                setAccountType('NEGOCIO')
              }
              className={`rounded-2xl border-2 p-5 text-left transition ${
                accountType === 'NEGOCIO'
                  ? 'border-[#E31E24] bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Negocio
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Publica promociones y llega a nuevos
                    clientes.
                  </p>
                </div>

                <div
                  className={`h-5 w-5 rounded-full border-2 ${
                    accountType === 'NEGOCIO'
                      ? 'border-[#E31E24] bg-[#E31E24]'
                      : 'border-slate-300'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {/* ACCOUNT */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Datos de la cuenta
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* NAME */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-bold text-slate-700"
                  >
                    Nombre completo
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-bold text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* PASSWORD */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-bold text-slate-700"
                  >
                    Contraseña
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* BUSINESS */}
            {accountType === 'NEGOCIO' && (
              <div className="border-t border-slate-100 pt-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Información del negocio
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Estos datos aparecerán junto a tus
                  promociones.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* BUSINESS NAME */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="businessName"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Nombre del negocio
                    </label>

                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(event) =>
                        setBusinessName(
                          event.target.value,
                        )
                      }
                      required
                      placeholder="Ej. Burger House"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E31E24] focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="businessDescription"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Descripción
                    </label>

                    <textarea
                      id="businessDescription"
                      value={businessDescription}
                      onChange={(event) =>
                        setBusinessDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Cuéntanos brevemente sobre tu negocio"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E31E24] focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label
                      htmlFor="businessPhone"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Teléfono
                    </label>

                    <input
                      id="businessPhone"
                      type="tel"
                      value={businessPhone}
                      onChange={(event) =>
                        setBusinessPhone(
                          event.target.value,
                        )
                      }
                      placeholder="Ej. 70000000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E31E24] focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {/* CITY */}
                  <div>
                    <label
                      htmlFor="businessCity"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Ciudad
                    </label>

                    <input
                      id="businessCity"
                      type="text"
                      value={businessCity}
                      onChange={(event) =>
                        setBusinessCity(
                          event.target.value,
                        )
                      }
                      placeholder="Ej. Sucre"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E31E24] focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {/* ADDRESS */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="businessAddress"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Dirección
                    </label>

                    <input
                      id="businessAddress"
                      type="text"
                      value={businessAddress}
                      onChange={(event) =>
                        setBusinessAddress(
                          event.target.value,
                        )
                      }
                      placeholder="Ej. Av. Hernando Siles #123"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E31E24] focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-3.5 text-sm font-black text-white transition ${
                accountType === 'NEGOCIO'
                  ? 'bg-[#E31E24] hover:bg-red-700'
                  : 'bg-[#1D52A0] hover:bg-blue-800'
              } ${
                loading
                  ? 'cursor-not-allowed opacity-60'
                  : ''
              }`}
            >
              {loading
                ? 'CREANDO CUENTA...'
                : accountType === 'NEGOCIO'
                  ? 'CREAR CUENTA DE NEGOCIO'
                  : 'CREAR CUENTA'}
            </button>
          </form>

          {/* LOGIN */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              ¿Ya tienes una cuenta?
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-1 text-sm font-bold text-[#1D52A0] hover:underline"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}