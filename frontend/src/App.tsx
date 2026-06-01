import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { initNative } from "@/lib/native";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/PageLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Home loads eagerly (it's the landing route); the rest are code-split so the
// initial bundle stays small and each page is fetched on demand.
import Home from "@/pages/Home";
const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const Login = lazy(() => import("@/pages/Login"));
const Account = lazy(() => import("@/pages/Account"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const VisualSearch = lazy(() => import("@/pages/VisualSearch"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Lives inside the Router so it can drive navigation from native events
// (e.g. the Android hardware back button) and scroll-to-top on route change.
function NativeShell() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initNative(() => {
      if (window.location.pathname !== "/") {
        navigate(-1);
        return true; // handled
      }
      return false; // at root → allow app to exit
    });
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <BrowserRouter>
                  <NativeShell />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:slug" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route
                          path="/order-confirmation/:orderNumber"
                          element={<OrderConfirmation />}
                        />
                        <Route path="/track" element={<TrackOrder />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/visual-search" element={<VisualSearch />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </BrowserRouter>
                <Toaster position="top-center" richColors />
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
