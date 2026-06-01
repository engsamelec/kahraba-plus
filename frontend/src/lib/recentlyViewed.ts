import type { Product } from "./api";

const KEY = "kahraba_recent";
const MAX = 12;

// Store a lightweight snapshot per product so the "recently viewed" strip can
// render instantly without extra network requests.
export interface RecentProduct {
  id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  name_he?: string | null;
  price: number;
  compare_at_price?: number | null;
  currency: string;
  image_urls: string[];
  in_stock: boolean;
  discount_percent: number;
  rating_avg: number;
  rating_count: number;
}

function toSnapshot(p: Product): RecentProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    name_ar: p.name_ar,
    name_he: p.name_he,
    price: p.price,
    compare_at_price: p.compare_at_price,
    currency: p.currency,
    image_urls: p.image_urls,
    in_stock: p.in_stock,
    discount_percent: p.discount_percent,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
  };
}

export function pushRecentlyViewed(product: Product) {
  try {
    const list: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [
      toSnapshot(product),
      ...list.filter((p) => p.id !== product.id),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewed(excludeId?: number): RecentProduct[] {
  try {
    const list: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    return excludeId ? list.filter((p) => p.id !== excludeId) : list;
  } catch {
    return [];
  }
}
