import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface FavoritesContextValue {
  ids: number[];
  isFavorite: (productId: number) => boolean;
  toggle: (productId: number) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);
const STORAGE_KEY = "kahraba_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  function toggle(productId: number) {
    setIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  const isFavorite = (productId: number) => ids.includes(productId);

  return (
    <FavoritesContext.Provider
      value={{ ids, isFavorite, toggle, count: ids.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
