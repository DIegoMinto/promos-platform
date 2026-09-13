import { useState } from 'react';

interface RegisterProps {
  onBackToHome: () => void;
  onRegisterSuccess: () => void;
}

function Register({
  onBackToHome,
  onRegisterSuccess,
}: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'CLIENTE',
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || 'No se pudo crear la cuenta',
        );
      }

      onRegisterSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al registrarse',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Panel izquierdo */}
        <div className="hidden bg-[#1D52A0] lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
          <img
            src="/logo.jpg"
            alt="Promo Bolivia"
            className="mb-10 h-16 w-auto object-contain object-left"
          />

          <h1 className="max-w-lg text-5xl font-black leading-tight text-white">
            Únete a Promo Bolivia.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
            Crea tu cuenta y descubre eventos, experiencias y
            promociones exclusivas de negocios en Bolivia.
          </p>
        </div>

        {/* Formulario */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <button
              type="button"
              onClick={onBackToHome}
              className="mb-6 text-sm font-bold text-[#1D52A0] hover:underline"
            >
              ← Volver al inicio
            </button>

            <div className="mb-8 lg:hidden">
              <img
                src="/logo.jpg"
                alt="Promo Bolivia"
                className="h-12 w-auto object-contain"
              />
            </div>

            <h2 className="text-3xl font-black text-gray-900">
              Crear cuenta
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Regístrate para comenzar a descubrir promociones.
            </p>

            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form
              onSubmit={handleRegister}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Nombre completo
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Correo electrónico
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Contraseña
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Confirmar contraseña
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1D52A0] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E31E24] py-3.5 text-sm font-black text-white shadow-md shadow-red-200 transition hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Al crear tu cuenta, aceptas nuestras condiciones
              de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;