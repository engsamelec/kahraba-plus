import axios from "axios";

// Base URL resolution:
// - Web (dev): relative "/api" → Vite proxies to Flask (see vite.config.ts).
// - Web (prod): relative "/api" → Flask serves SPA + API on the same origin.
// - Mobile (Capacitor): the app runs from capacitor://localhost, so it MUST
//   call an absolute backend URL. Set VITE_API_URL at build time, e.g.
//   VITE_API_URL=https://api.kahrabaplus.com/api
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "kahraba_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ---------- Types ----------
export interface Category {
  id: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  description?: string | null;
  icon?: string | null;
  product_count?: number;
}

export interface Product {
  id: number;
  product_number?: string;
  name: string;
  name_ar?: string | null;
  name_he?: string | null;
  slug: string;
  sku?: string | null;
  brand?: string | null;
  price: number;
  cost?: number | null;
  compare_at_price?: number | null;
  discount_percent: number;
  currency: string;
  stock_quantity: number;
  in_stock: boolean;
  category_id?: number | null;
  category?: Category | null;
  image_urls: string[];
  image_hashes?: (number | string)[];
  match_score?: number;
  match_distance?: number;
  has_variants?: boolean;
  variants?: ProductVariant[];
  is_featured: boolean;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  low_stock?: boolean;
  is_bestseller?: boolean;
  description?: string;
  description_ar?: string;
  description_he?: string;
  technical_specs?: Record<string, string>;
  reviews?: Review[];
  related?: Product[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  material?: string | null;
  additional_price: number;
  stock_quantity: number;
  sku?: string | null;
  image_url?: string | null;
  is_available: boolean;
  in_stock: boolean;
  sort_order: number;
  label: string;
}

export interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  product_name_ar?: string | null;
  product_name_he?: string | null;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount?: number;
  coupon_code?: string | null;
  shipping_cost: number;
  tax: number;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  notes?: string | null;
  created_at?: string;
  items: OrderItem[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Quote {
  subtotal: number;
  discount?: number;
  coupon_code?: string | null;
  coupon_error?: string;
  shipping_cost: number;
  tax: number;
  total_amount: number;
  currency: string;
  shipping_scope: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  is_active: boolean;
  status: string;
}
