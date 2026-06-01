import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./api";

// Lightweight snapshot stored for comparison (enough to render the table).
export interface CompareProduct {
  id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  name_he?: string | null;
  brand?: string | null;
  price: number;
  image_urls: string[];
  rating_avg: number;
  rating_count: number;
  in_stock: boolean;
  technical_specs?: Record<string, string>;
}

const MAX = 4;
const KEY = "kahraba_compare";

interface CompareContextValue {
  items: CompareProduct[];
  ids: number[];
  has: (id: number) => boolean;
  toggle: (p: Product) => void;
  remove: (id: number) => void;
  clear: () => void;
  count: number;
  full: boolean;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

function snapshot(p: Product): CompareProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    name_ar: p.name_ar,
    name_he: p.name_he,
    brand: p.brand,
    price: p.price,
    image_urls: p.image_urls,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    in_stock: p.in_stock,
    technical_specs: p.technical_specs,
  };
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const toggle = useCallback((p: Product) => {
    setItems((prev) => {
      if (prev.some((x) => x.id === p.id)) {
        return prev.filter((x) => x.id !== p.id);
      }
      if (prev.length >= MAX) return prev; // cap reached
      return [...prev, snapshot(p)];
    });
  }, []);

  const remove = useCallback(
    (id: number) => setItems((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  return (
    <CompareContext.Provider
      value={{
        items,
        ids: items.map((x) => x.id),
        has,
        toggle,
        remove,
        clear,
        count: items.length,
        full: items.length >= MAX,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export const COMPARE_MAX = MAX;
