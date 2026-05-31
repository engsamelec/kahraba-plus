import axios from "axios";

// In dev, Vite proxies /api to the Flask backend (see vite.config.ts).
// In production the Flask app serves the built frontend from the same origin.
const api = axios.create({
  baseURL: "/api",
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
  name: string;
  name_ar?: string | null;
  slug: string;
  sku?: string | null;
  brand?: string | null;
  price: number;
  compare_at_price?: number | null;
  discount_percent: number;
  currency: string;
  stock_quantity: number;
  in_stock: boolean;
  category_id?: number | null;
  category?: Category | null;
  image_urls: string[];
  is_featured: boolean;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  description?: string;
  description_ar?: string;
  technical_specs?: Record<string, string>;
  reviews?: Review[];
  related?: Product[];
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
  shipping_cost: number;
  tax: number;
  total_amount: number;
  currency: string;
  shipping_scope: string;
}
