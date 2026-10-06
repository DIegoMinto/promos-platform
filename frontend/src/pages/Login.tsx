import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Credenciales incorrectas',
        );
      }

      console.log('Login exitoso:', data);

      login(data.accessToken, data.user);

      if (data.user.role === 'NEGOCIO') {
        navigate('/negocio');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al iniciar sesión',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/20" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <img
              src="/logo.jpg"
              alt="Promo Bolivia"
              className="h-14 w-fit object-contain"
            />

            <div className="max-w-lg">
              <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-light">
                Bienvenido a Promo Bolivia
              </span>

              <h1 className="mt-6 text-5xl font-black leading-tight text-white">
                Descubre.
                <br />
                Ahorra.
                <br />
                <span className="text-accent">Disfruta.</span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-primary-light">
                Encuentra eventos, experiencias y promociones exclusivas
                de negocios en Bolivia.
              </p>
            </div>

            <p className="text-xs text-primary-light">
              © 2026 Promo Bolivia. Todos los derechos reservados.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/logo.jpg"
                alt="Promo Bolivia"
                className="h-14 w-auto object-contain"
              />
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Ingresa a tu cuenta para continuar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="mb-6 text-sm font-bold text-primary hover:underline"
              >
                ← Volver al inicio
              </button>

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="tucorreo@email.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-light"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-slate-700"
                    >
                      Contraseña
                    </label>

                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-light"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-primary"
                  />

                  <label
                    htmlFor="remember"
                    className="text-sm text-slate-500"
                  >
                    Recordarme
                  </label>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-accent py-3.5 text-sm font-black text-white shadow-md shadow-accent/30 transition hover:bg-accent-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'INGRESANDO...'
                    : 'INICIAR SESIÓN'}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  ¿No tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-black text-primary hover:underline"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;