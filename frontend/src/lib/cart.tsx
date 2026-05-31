import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./api";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "kahraba_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function add(product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? {
                ...l,
                quantity: Math.min(
                  l.quantity + quantity,
                  product.stock_quantity
                ),
              }
            : l
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock_quantity) }];
    });
  }

  function remove(productId: number) {
    setItems((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function setQuantity(productId: number, quantity: number) {
    setItems((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.max(1, Math.min(quantity, l.product.stock_quantity)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const line of items) {
      c += line.quantity;
      s += line.quantity * line.product.price;
    }
    return { count: c, subtotal: Math.round(s * 100) / 100 };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, add, remove, setQuantity, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
