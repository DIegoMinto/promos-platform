
import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function CartButton() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'CLIENTE' || !accessToken) {
      setItemCount(0);
      return;
    }

    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cart`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) return;

        const cart = await response.json();

        if (!cancelled) {
          setItemCount(Number(cart.itemCount ?? 0));
        }
      } catch (error) {
        console.error('No se pudo consultar el carrito:', error);
      }
    }

    loadCount();

    return () => {
      cancelled = true;
    };
  }, [user?.role, accessToken]);

  if (user?.role !== 'CLIENTE') return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/carrito')}
      aria-label={`Ver carrito, ${itemCount} unidades`}
      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-primary px-3 text-primary transition hover:bg-primary hover:text-white"
    >
      <ShoppingCart size={19} />

      <span className="hidden text-xs font-bold sm:inline">
        CARRITO
      </span>

      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
