
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface CartItem {
  id: number;
  promotionId: number;
  title: string;
  image: string | null;
  business: {
    id: number;
    name: string;
    logo: string | null;
  };
  category: {
    id: number;
    name: string;
  };
  quantity: number;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  unavailableReason: string | null;
}

interface CartData {
  id: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL;

  const requestHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const loadCart = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setError('');

      const response = await fetch(`${apiUrl}/api/cart`, {
        headers: requestHeaders,
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el carrito.');
      }

      const data: CartData = await response.json();
      setCart(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar el carrito.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiUrl]);

  useEffect(() => {
    if (user?.role !== 'CLIENTE') {
      navigate('/login', { replace: true });
      return;
    }

    void loadCart();
  }, [user?.role, navigate, loadCart]);

  async function updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1 || quantity > 99) return;

    setBusyItem(item.id);
    setError('');

    try {
      const response = await fetch(
        `${apiUrl}/api/cart/items/${item.id}`,
        {
          method: 'PATCH',
          headers: requestHeaders,
          body: JSON.stringify({ quantity }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'No se pudo actualizar la cantidad.');
      }

      setCart(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo actualizar el artículo.',
      );
    } finally {
      setBusyItem(null);
    }
  }

  async function removeItem(itemId: number) {
    setBusyItem(itemId);
    setError('');

    try {
      const response = await fetch(
        `${apiUrl}/api/cart/items/${itemId}`,
        {
          method: 'DELETE',
          headers: requestHeaders,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'No se pudo eliminar el artículo.');
      }

      setCart(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo eliminar el artículo.',
      );
    } finally {
      setBusyItem(null);
    }
  }

  async function clearCart() {
    if (!window.confirm('¿Quieres quitar todos los artículos del carrito?')) {
      return;
    }

    setClearing(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: 'DELETE',
        headers: requestHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'No se pudo vaciar el carrito.');
      }

      setCart(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo vaciar el carrito.',
      );
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-500">Cargando tu carrito...</p>
      </main>
    );
  }

  if (!cart) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600">
          {error || 'No se pudo cargar el carrito.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Volver al inicio
        </button>
      </main>
    );
  }

  const availableItems = cart.items.filter((item) => item.available);
  const hasUnavailableItems = availableItems.length !== cart.items.length;

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft size={18} />
          Seguir explorando
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ShoppingCart size={23} />
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Mi carrito
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {cart.itemCount} {cart.itemCount === 1 ? 'unidad' : 'unidades'}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cart.items.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <ShoppingCart size={36} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Tu carrito está vacío
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Encuentra una promoción y agrégala a tu carrito.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              Explorar promociones
            </button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              {cart.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=300'
                      }
                      alt={item.title}
                      className="h-24 w-24 shrink-0 rounded-xl bg-slate-100 object-cover sm:h-28 sm:w-28"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.category.name}
                      </p>
                      <h2 className="mt-1 font-bold text-slate-900">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.business.name}
                      </p>
<div className="mt-2">
  {item.fulfillmentType === 'DELIVERY' ? (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
      A mi puerta
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
      Paso a recogerlo
    </span>
  )}
</div>

                      <p className="mt-2 font-black text-accent">
                        Bs. {item.unitPrice.toFixed(2)}
                      </p>

                      {!item.available && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {item.unavailableReason ?? 'Promoción no disponible'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={busyItem === item.id || item.quantity <= 1}
                        onClick={() => void updateQuantity(item, item.quantity - 1)}
                        aria-label="Reducir cantidad"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-5 text-center text-sm font-bold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={busyItem === item.id || item.quantity >= 99}
                        onClick={() => void updateQuantity(item, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-slate-900">
                        Bs. {item.lineTotal.toFixed(2)}
                      </p>

                      <button
                        type="button"
                        disabled={busyItem === item.id}
                        onClick={() => void removeItem(item.id)}
                        aria-label={`Eliminar ${item.title}`}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              <button
                type="button"
                disabled={clearing}
                onClick={() => void clearCart()}
                className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
              >
                Vaciar carrito
              </button>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Resumen
              </h2>

              <div className="mt-5 flex justify-between text-sm text-slate-600">
                <span>Subtotal de promociones</span>
                <span className="font-bold text-slate-900">
                  Bs. {cart.subtotal.toFixed(2)}
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                El costo de entrega, si corresponde, se calculará durante el checkout.
              </p>

              {hasUnavailableItems && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Quita las promociones no disponibles antes de continuar.
                </p>
              )}

              <button
                type="button"
                disabled={availableItems.length === 0 || hasUnavailableItems}
                onClick={() => navigate('/checkout')}
                className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-black text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                CONTINUAR AL CHECKOUT
              </button>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                El pedido se confirma después de verificar el pago.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
