import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const translations: Dict = {
  // Brand / general
  brand: { ar: "كهربا بلس", en: "Kahraba Plus" },
  tagline: {
    ar: "كل ما تحتاجه من إلكترونيات وقطع كهربائية",
    en: "Everything you need in electronics & components",
  },
  // Nav
  nav_home: { ar: "الرئيسية", en: "Home" },
  nav_shop: { ar: "المتجر", en: "Shop" },
  nav_categories: { ar: "الأقسام", en: "Categories" },
  nav_track: { ar: "تتبع الطلب", en: "Track Order" },
  nav_cart: { ar: "السلة", en: "Cart" },
  nav_account: { ar: "حسابي", en: "Account" },
  nav_login: { ar: "تسجيل الدخول", en: "Login" },
  nav_logout: { ar: "خروج", en: "Logout" },
  nav_admin: { ar: "لوحة التحكم", en: "Admin" },
  search_placeholder: { ar: "ابحث عن منتج...", en: "Search products..." },
  // Home
  hero_title: {
    ar: "قطعك الإلكترونية بين يديك",
    en: "Your electronics, delivered",
  },
  hero_subtitle: {
    ar: "أردوينو، حساسات، محركات، طاقة شمسية وأكثر — شحن محلي ودولي",
    en: "Arduino, sensors, motors, solar & more — shipped locally and worldwide",
  },
  hero_cta: { ar: "تسوّق الآن", en: "Shop Now" },
  shop_categories: { ar: "تسوّق حسب القسم", en: "Shop by Category" },
  featured: { ar: "منتجات مميزة", en: "Featured Products" },
  view_all: { ar: "عرض الكل", en: "View All" },
  why_us: { ar: "لماذا كهربا بلس؟", en: "Why Kahraba Plus?" },
  feat_shipping: { ar: "شحن محلي ودولي", en: "Local & Global Shipping" },
  feat_shipping_d: {
    ar: "نوصل لأي مكان، شحن مجاني للطلبات فوق 100$",
    en: "We deliver anywhere. Free shipping over $100",
  },
  feat_genuine: { ar: "قطع أصلية", en: "Genuine Parts" },
  feat_genuine_d: {
    ar: "منتجات مضمونة من علامات موثوقة",
    en: "Guaranteed products from trusted brands",
  },
  feat_cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
  feat_cod_d: {
    ar: "ادفع نقداً عند وصول طلبك",
    en: "Pay in cash when your order arrives",
  },
  feat_support: { ar: "دعم فني", en: "Technical Support" },
  feat_support_d: {
    ar: "فريق يساعدك في اختيار القطع المناسبة",
    en: "A team to help you pick the right parts",
  },
  // Shop / filters
  filters: { ar: "تصفية", en: "Filters" },
  all_categories: { ar: "كل الأقسام", en: "All Categories" },
  price_range: { ar: "نطاق السعر", en: "Price Range" },
  in_stock_only: { ar: "المتوفر فقط", en: "In stock only" },
  sort_by: { ar: "ترتيب", en: "Sort by" },
  sort_newest: { ar: "الأحدث", en: "Newest" },
  sort_price_asc: { ar: "السعر: من الأقل", en: "Price: Low to High" },
  sort_price_desc: { ar: "السعر: من الأعلى", en: "Price: High to Low" },
  sort_rating: { ar: "الأعلى تقييماً", en: "Top Rated" },
  no_products: { ar: "لا توجد منتجات مطابقة", en: "No matching products" },
  results: { ar: "نتيجة", en: "results" },
  clear_filters: { ar: "مسح الفلاتر", en: "Clear filters" },
  // Product
  add_to_cart: { ar: "أضف إلى السلة", en: "Add to Cart" },
  buy_now: { ar: "اشترِ الآن", en: "Buy Now" },
  out_of_stock: { ar: "غير متوفر", en: "Out of stock" },
  in_stock: { ar: "متوفر", en: "In stock" },
  specifications: { ar: "المواصفات", en: "Specifications" },
  description: { ar: "الوصف", en: "Description" },
  reviews: { ar: "التقييمات", en: "Reviews" },
  related_products: { ar: "منتجات ذات صلة", en: "Related Products" },
  brand_label: { ar: "العلامة", en: "Brand" },
  sku_label: { ar: "رمز المنتج", en: "SKU" },
  quantity: { ar: "الكمية", en: "Quantity" },
  off: { ar: "خصم", en: "OFF" },
  write_review: { ar: "اكتب تقييماً", en: "Write a review" },
  no_reviews: { ar: "لا توجد تقييمات بعد", en: "No reviews yet" },
  submit_review: { ar: "إرسال التقييم", en: "Submit Review" },
  // Cart
  cart_title: { ar: "سلة التسوق", en: "Shopping Cart" },
  cart_empty: { ar: "سلتك فارغة", en: "Your cart is empty" },
  cart_empty_cta: { ar: "ابدأ التسوق", en: "Start shopping" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
  shipping: { ar: "الشحن", en: "Shipping" },
  tax: { ar: "الضريبة", en: "Tax" },
  total: { ar: "الإجمالي", en: "Total" },
  checkout: { ar: "إتمام الطلب", en: "Checkout" },
  continue_shopping: { ar: "متابعة التسوق", en: "Continue Shopping" },
  remove: { ar: "إزالة", en: "Remove" },
  free: { ar: "مجاني", en: "Free" },
  // Checkout
  checkout_title: { ar: "إتمام الطلب", en: "Checkout" },
  contact_info: { ar: "معلومات التواصل", en: "Contact Information" },
  shipping_info: { ar: "عنوان الشحن", en: "Shipping Address" },
  full_name: { ar: "الاسم الكامل", en: "Full Name" },
  last_name: { ar: "الاسم الأخير", en: "Last Name" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone: { ar: "رقم الهاتف", en: "Phone" },
  address: { ar: "العنوان", en: "Address" },
  city: { ar: "المدينة", en: "City" },
  country: { ar: "الدولة", en: "Country" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  payment_method: { ar: "طريقة الدفع", en: "Payment Method" },
  pay_cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
  pay_card: { ar: "بطاقة ائتمان", en: "Credit / Debit Card" },
  place_order: { ar: "تأكيد الطلب", en: "Place Order" },
  order_summary: { ar: "ملخص الطلب", en: "Order Summary" },
  // Order confirmation / track
  order_placed: { ar: "تم استلام طلبك!", en: "Order Placed!" },
  order_placed_d: {
    ar: "شكراً لك. سنتواصل معك لتأكيد الطلب.",
    en: "Thank you. We'll contact you to confirm.",
  },
  order_number: { ar: "رقم الطلب", en: "Order Number" },
  track_title: { ar: "تتبع طلبك", en: "Track Your Order" },
  track_placeholder: { ar: "أدخل رقم الطلب", en: "Enter order number" },
  track_btn: { ar: "تتبع", en: "Track" },
  order_not_found: { ar: "لم يتم العثور على الطلب", en: "Order not found" },
  status: { ar: "الحالة", en: "Status" },
  status_pending: { ar: "قيد الانتظار", en: "Pending" },
  status_processing: { ar: "قيد المعالجة", en: "Processing" },
  status_shipped: { ar: "تم الشحن", en: "Shipped" },
  status_delivered: { ar: "تم التسليم", en: "Delivered" },
  status_cancelled: { ar: "ملغي", en: "Cancelled" },
  // Auth
  login_title: { ar: "تسجيل الدخول", en: "Login" },
  register_title: { ar: "إنشاء حساب", en: "Create Account" },
  password: { ar: "كلمة المرور", en: "Password" },
  no_account: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  have_account: { ar: "لديك حساب؟", en: "Already have an account?" },
  register_now: { ar: "سجّل الآن", en: "Register now" },
  login_now: { ar: "ادخل الآن", en: "Login now" },
  // Account
  my_account: { ar: "حسابي", en: "My Account" },
  my_orders: { ar: "طلباتي", en: "My Orders" },
  profile: { ar: "الملف الشخصي", en: "Profile" },
  no_orders: { ar: "لا توجد طلبات بعد", en: "No orders yet" },
  save: { ar: "حفظ", en: "Save" },
  // Admin
  admin_dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  admin_products: { ar: "المنتجات", en: "Products" },
  admin_orders: { ar: "الطلبات", en: "Orders" },
  total_revenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
  total_orders: { ar: "إجمالي الطلبات", en: "Total Orders" },
  pending_orders: { ar: "طلبات معلقة", en: "Pending Orders" },
  total_products: { ar: "المنتجات", en: "Products" },
  total_customers: { ar: "العملاء", en: "Customers" },
  add_product: { ar: "إضافة منتج", en: "Add Product" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  save_product: { ar: "حفظ المنتج", en: "Save Product" },
  // Footer
  footer_about: { ar: "عن المتجر", en: "About" },
  footer_about_d: {
    ar: "كهربا بلس متجرك المتخصص بالإلكترونيات والقطع الكهربائية، نخدم العملاء محلياً ودولياً.",
    en: "Kahraba Plus is your specialized store for electronics and electrical components, serving customers locally and worldwide.",
  },
  footer_links: { ar: "روابط سريعة", en: "Quick Links" },
  footer_contact: { ar: "تواصل معنا", en: "Contact Us" },
  footer_rights: {
    ar: "جميع الحقوق محفوظة",
    en: "All rights reserved",
  },
  // misc
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  error_generic: { ar: "حدث خطأ ما", en: "Something went wrong" },
  currency_symbol: { ar: "$", en: "$" },
};

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof translations | string) => string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("kahraba_lang") as Lang) || "ar"
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("kahraba_lang", lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(
    () => setLangState((l) => (l === "ar" ? "en" : "ar")),
    []
  );

  const t = useCallback(
    (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, dir, t, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Helper: pick localized product/category name
export function localized<T extends { name: string; name_ar?: string | null }>(
  item: T,
  lang: Lang
): string {
  if (lang === "ar" && item.name_ar) return item.name_ar;
  return item.name;
}
