import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en" | "he";

export const LANGS: { code: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "he", label: "עברית", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
];

type Entry = { ar: string; en: string; he: string };
type Dict = Record<string, Entry>;

const translations: Dict = {
  // Brand / general
  brand: { ar: "كهربا بلس", en: "Kahraba Plus", he: "כהרבא פלוס" },
  tagline: {
    ar: "كل ما تحتاجه من إلكترونيات وقطع كهربائية",
    en: "Everything you need in electronics & components",
    he: "כל מה שצריך באלקטרוניקה ורכיבים",
  },
  // Nav
  nav_home: { ar: "الرئيسية", en: "Home", he: "דף הבית" },
  nav_shop: { ar: "المتجر", en: "Shop", he: "חנות" },
  nav_categories: { ar: "الأقسام", en: "Categories", he: "קטגוריות" },
  nav_track: { ar: "تتبع الطلب", en: "Track Order", he: "מעקב הזמנה" },
  nav_cart: { ar: "السلة", en: "Cart", he: "עגלה" },
  nav_account: { ar: "حسابي", en: "Account", he: "החשבון שלי" },
  nav_login: { ar: "تسجيل الدخول", en: "Login", he: "התחברות" },
  nav_logout: { ar: "خروج", en: "Logout", he: "התנתקות" },
  nav_admin: { ar: "لوحة التحكم", en: "Admin", he: "ניהול" },
  search_placeholder: {
    ar: "ابحث عن منتج...",
    en: "Search products...",
    he: "חיפוש מוצרים...",
  },
  // Home
  hero_title: {
    ar: "قطعك الإلكترونية بين يديك",
    en: "Your electronics, delivered",
    he: "האלקטרוניקה שלך, עד הבית",
  },
  hero_subtitle: {
    ar: "أردوينو، حساسات، محركات، طاقة شمسية وأكثر — شحن محلي ودولي",
    en: "Arduino, sensors, motors, solar & more — shipped locally and worldwide",
    he: "ארדואינו, חיישנים, מנועים, אנרגיה סולארית ועוד — משלוח מקומי ובינלאומי",
  },
  hero_cta: { ar: "تسوّق الآن", en: "Shop Now", he: "לקנייה" },
  shop_categories: {
    ar: "تسوّق حسب القسم",
    en: "Shop by Category",
    he: "קנייה לפי קטגוריה",
  },
  featured: { ar: "منتجات مميزة", en: "Featured Products", he: "מוצרים מובחרים" },
  view_all: { ar: "عرض الكل", en: "View All", he: "הצג הכול" },
  why_us: { ar: "لماذا كهربا بلس؟", en: "Why Kahraba Plus?", he: "למה כהרבא פלוס?" },
  feat_shipping: {
    ar: "شحن محلي ودولي",
    en: "Local & Global Shipping",
    he: "משלוח מקומי ובינלאומי",
  },
  feat_shipping_d: {
    ar: "نوصل لأي مكان، شحن مجاني للطلبات فوق 100$",
    en: "We deliver anywhere. Free shipping over $100",
    he: "משלוח לכל מקום, חינם בהזמנות מעל 100$",
  },
  feat_genuine: { ar: "قطع أصلية", en: "Genuine Parts", he: "חלקים מקוריים" },
  feat_genuine_d: {
    ar: "منتجات مضمونة من علامات موثوقة",
    en: "Guaranteed products from trusted brands",
    he: "מוצרים מובטחים ממותגים אמינים",
  },
  feat_cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery", he: "תשלום במזומן בעת קבלה" },
  feat_cod_d: {
    ar: "ادفع نقداً عند وصول طلبك",
    en: "Pay in cash when your order arrives",
    he: "שלם במזומן כשההזמנה מגיעה",
  },
  feat_support: { ar: "دعم فني", en: "Technical Support", he: "תמיכה טכנית" },
  feat_support_d: {
    ar: "فريق يساعدك في اختيار القطع المناسبة",
    en: "A team to help you pick the right parts",
    he: "צוות שיעזור לך לבחור את החלקים הנכונים",
  },
  // Shop / filters
  filters: { ar: "تصفية", en: "Filters", he: "סינון" },
  all_categories: { ar: "كل الأقسام", en: "All Categories", he: "כל הקטגוריות" },
  price_range: { ar: "نطاق السعر", en: "Price Range", he: "טווח מחירים" },
  in_stock_only: { ar: "المتوفر فقط", en: "In stock only", he: "במלאי בלבד" },
  sort_by: { ar: "ترتيب", en: "Sort by", he: "מיון" },
  sort_newest: { ar: "الأحدث", en: "Newest", he: "החדש ביותר" },
  sort_price_asc: { ar: "السعر: من الأقل", en: "Price: Low to High", he: "מחיר: מהנמוך לגבוה" },
  sort_price_desc: { ar: "السعر: من الأعلى", en: "Price: High to Low", he: "מחיר: מהגבוה לנמוך" },
  sort_rating: { ar: "الأعلى تقييماً", en: "Top Rated", he: "המדורגים ביותר" },
  no_products: { ar: "لا توجد منتجات مطابقة", en: "No matching products", he: "לא נמצאו מוצרים" },
  results: { ar: "نتيجة", en: "results", he: "תוצאות" },
  clear_filters: { ar: "مسح الفلاتر", en: "Clear filters", he: "נקה סינון" },
  // Product
  add_to_cart: { ar: "أضف إلى السلة", en: "Add to Cart", he: "הוסף לעגלה" },
  buy_now: { ar: "اشترِ الآن", en: "Buy Now", he: "קנה עכשיו" },
  add_favorite: { ar: "أضف إلى المفضلة", en: "Add to favorites", he: "הוסף למועדפים" },
  remove_favorite: { ar: "إزالة من المفضلة", en: "Remove from favorites", he: "הסר מהמועדפים" },
  added_favorite: { ar: "أُضيف إلى المفضلة", en: "Added to favorites", he: "נוסף למועדפים" },
  removed_favorite: { ar: "أُزيل من المفضلة", en: "Removed from favorites", he: "הוסר מהמועדפים" },
  favorites: { ar: "المفضلة", en: "Favorites", he: "מועדפים" },
  no_favorites: {
    ar: "لا توجد منتجات في المفضلة بعد",
    en: "No favorites yet",
    he: "אין מועדפים עדיין",
  },
  out_of_stock: { ar: "غير متوفر", en: "Out of stock", he: "אזל מהמלאי" },
  in_stock: { ar: "متوفر", en: "In stock", he: "במלאי" },
  specifications: { ar: "المواصفات", en: "Specifications", he: "מפרט" },
  description: { ar: "الوصف", en: "Description", he: "תיאור" },
  reviews: { ar: "التقييمات", en: "Reviews", he: "ביקורות" },
  related_products: { ar: "منتجات ذات صلة", en: "Related Products", he: "מוצרים קשורים" },
  brand_label: { ar: "العلامة", en: "Brand", he: "מותג" },
  sku_label: { ar: "رمز المنتج", en: "SKU", he: 'מק"ט' },
  quantity: { ar: "الكمية", en: "Quantity", he: "כמות" },
  off: { ar: "خصم", en: "OFF", he: "הנחה" },
  write_review: { ar: "اكتب تقييماً", en: "Write a review", he: "כתוב ביקורת" },
  no_reviews: { ar: "لا توجد تقييمات بعد", en: "No reviews yet", he: "אין ביקורות עדיין" },
  submit_review: { ar: "إرسال التقييم", en: "Submit Review", he: "שלח ביקורת" },
  // Cart
  cart_title: { ar: "سلة التسوق", en: "Shopping Cart", he: "עגלת קניות" },
  cart_empty: { ar: "سلتك فارغة", en: "Your cart is empty", he: "העגלה שלך ריקה" },
  cart_empty_cta: { ar: "ابدأ التسوق", en: "Start shopping", he: "התחל לקנות" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal", he: "סכום ביניים" },
  shipping: { ar: "الشحن", en: "Shipping", he: "משלוח" },
  tax: { ar: "الضريبة", en: "Tax", he: "מס" },
  total: { ar: "الإجمالي", en: "Total", he: 'סה"כ' },
  checkout: { ar: "إتمام الطلب", en: "Checkout", he: "לתשלום" },
  continue_shopping: { ar: "متابعة التسوق", en: "Continue Shopping", he: "המשך לקנות" },
  remove: { ar: "إزالة", en: "Remove", he: "הסר" },
  free: { ar: "مجاني", en: "Free", he: "חינם" },
  // Checkout
  checkout_title: { ar: "إتمام الطلب", en: "Checkout", he: "תשלום" },
  contact_info: { ar: "معلومات التواصل", en: "Contact Information", he: "פרטי קשר" },
  shipping_info: { ar: "عنوان الشحن", en: "Shipping Address", he: "כתובת למשלוח" },
  full_name: { ar: "الاسم الكامل", en: "Full Name", he: "שם מלא" },
  last_name: { ar: "الاسم الأخير", en: "Last Name", he: "שם משפחה" },
  email: { ar: "البريد الإلكتروني", en: "Email", he: 'דוא"ל' },
  phone: { ar: "رقم الهاتف", en: "Phone", he: "טלפון" },
  address: { ar: "العنوان", en: "Address", he: "כתובת" },
  city: { ar: "المدينة", en: "City", he: "עיר" },
  country: { ar: "الدولة", en: "Country", he: "מדינה" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)", he: "הערות (אופציונלי)" },
  payment_method: { ar: "طريقة الدفع", en: "Payment Method", he: "אמצעי תשלום" },
  pay_cod: { ar: "الدفع عند الاستلام", en: "Cash on Delivery", he: "תשלום במזומן בעת קבלה" },
  pay_card: { ar: "بطاقة ائتمان", en: "Credit / Debit Card", he: "כרטיס אשראי / חיוב" },
  place_order: { ar: "تأكيد الطلب", en: "Place Order", he: "בצע הזמנה" },
  order_summary: { ar: "ملخص الطلب", en: "Order Summary", he: "סיכום הזמנה" },
  // Order confirmation / track
  order_placed: { ar: "تم استلام طلبك!", en: "Order Placed!", he: "ההזמנה התקבלה!" },
  order_placed_d: {
    ar: "شكراً لك. سنتواصل معك لتأكيد الطلب.",
    en: "Thank you. We'll contact you to confirm.",
    he: "תודה. ניצור איתך קשר לאישור ההזמנה.",
  },
  order_number: { ar: "رقم الطلب", en: "Order Number", he: "מספר הזמנה" },
  track_title: { ar: "تتبع طلبك", en: "Track Your Order", he: "מעקב אחר ההזמנה" },
  track_placeholder: { ar: "أدخل رقم الطلب", en: "Enter order number", he: "הזן מספר הזמנה" },
  track_btn: { ar: "تتبع", en: "Track", he: "עקוב" },
  order_not_found: { ar: "لم يتم العثور على الطلب", en: "Order not found", he: "ההזמנה לא נמצאה" },
  status: { ar: "الحالة", en: "Status", he: "סטטוס" },
  status_pending: { ar: "قيد الانتظار", en: "Pending", he: "ממתין" },
  status_processing: { ar: "قيد المعالجة", en: "Processing", he: "בטיפול" },
  status_shipped: { ar: "تم الشحن", en: "Shipped", he: "נשלח" },
  status_delivered: { ar: "تم التسليم", en: "Delivered", he: "נמסר" },
  status_cancelled: { ar: "ملغي", en: "Cancelled", he: "בוטל" },
  // Auth
  login_title: { ar: "تسجيل الدخول", en: "Login", he: "התחברות" },
  register_title: { ar: "إنشاء حساب", en: "Create Account", he: "יצירת חשבון" },
  password: { ar: "كلمة المرور", en: "Password", he: "סיסמה" },
  no_account: { ar: "ليس لديك حساب؟", en: "Don't have an account?", he: "אין לך חשבון?" },
  have_account: { ar: "لديك حساب؟", en: "Already have an account?", he: "כבר יש לך חשבון?" },
  register_now: { ar: "سجّل الآن", en: "Register now", he: "הירשם עכשיו" },
  login_now: { ar: "ادخل الآن", en: "Login now", he: "התחבר עכשיו" },
  // Account
  my_account: { ar: "حسابي", en: "My Account", he: "החשבון שלי" },
  my_orders: { ar: "طلباتي", en: "My Orders", he: "ההזמנות שלי" },
  profile: { ar: "الملف الشخصي", en: "Profile", he: "פרופיל" },
  no_orders: { ar: "لا توجد طلبات بعد", en: "No orders yet", he: "אין הזמנות עדיין" },
  save: { ar: "حفظ", en: "Save", he: "שמור" },
  // Admin
  admin_dashboard: { ar: "لوحة التحكم", en: "Dashboard", he: "לוח בקרה" },
  admin_products: { ar: "المنتجات", en: "Products", he: "מוצרים" },
  admin_orders: { ar: "الطلبات", en: "Orders", he: "הזמנות" },
  total_revenue: { ar: "إجمالي الإيرادات", en: "Total Revenue", he: "סך ההכנסות" },
  total_orders: { ar: "إجمالي الطلبات", en: "Total Orders", he: "סך ההזמנות" },
  pending_orders: { ar: "طلبات معلقة", en: "Pending Orders", he: "הזמנות ממתינות" },
  total_products: { ar: "المنتجات", en: "Products", he: "מוצרים" },
  total_customers: { ar: "العملاء", en: "Customers", he: "לקוחות" },
  add_product: { ar: "إضافة منتج", en: "Add Product", he: "הוסף מוצר" },
  edit: { ar: "تعديل", en: "Edit", he: "עריכה" },
  delete: { ar: "حذف", en: "Delete", he: "מחיקה" },
  save_product: { ar: "حفظ المنتج", en: "Save Product", he: "שמור מוצר" },
  // Footer
  footer_about: { ar: "عن المتجر", en: "About", he: "אודות" },
  footer_about_d: {
    ar: "كهربا بلس متجرك المتخصص بالإلكترونيات والقطع الكهربائية، نخدم العملاء محلياً ودولياً.",
    en: "Kahraba Plus is your specialized store for electronics and electrical components, serving customers locally and worldwide.",
    he: "כהרבא פלוס היא חנות מתמחה באלקטרוניקה וברכיבי חשמל, המשרתת לקוחות מקומית ובעולם.",
  },
  footer_links: { ar: "روابط سريعة", en: "Quick Links", he: "קישורים מהירים" },
  footer_contact: { ar: "تواصل معنا", en: "Contact Us", he: "צור קשר" },
  footer_rights: {
    ar: "جميع الحقوق محفوظة",
    en: "All rights reserved",
    he: "כל הזכויות שמורות",
  },
  // misc
  loading: { ar: "جاري التحميل...", en: "Loading...", he: "טוען..." },
  error_generic: { ar: "حدث خطأ ما", en: "Something went wrong", he: "אירעה שגיאה" },
  currency_symbol: { ar: "$", en: "$", he: "$" },
  free_ship_banner: {
    ar: "🚚 شحن مجاني للطلبات فوق 100$ — محلياً ودولياً",
    en: "🚚 Free shipping on orders over $100 — local & worldwide",
    he: "🚚 משלוח חינם בהזמנות מעל 100$ — מקומי ובעולם",
  },
  items_count: { ar: "منتج", en: "items", he: "פריטים" },
  soon: { ar: "قريباً", en: "Soon", he: "בקרוב" },
  calc_at_checkout: {
    ar: "يُحسب عند الدفع",
    en: "Calculated at checkout",
    he: "מחושב בתשלום",
  },
  not_found_title: {
    ar: "الصفحة غير موجودة",
    en: "Page not found",
    he: "הדף לא נמצא",
  },
  not_found_desc: {
    ar: "يبدو أن هذا الرابط مقطوع أو أن الصفحة لم تعد متاحة.",
    en: "This link looks broken or the page is no longer available.",
    he: "נראה שהקישור שבור או שהדף כבר אינו זמין.",
  },
};

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof translations | string) => string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "kahraba_lang";

function dirOf(lang: Lang): "rtl" | "ltr" {
  return lang === "en" ? "ltr" : "rtl";
}

function isLang(v: unknown): v is Lang {
  return v === "ar" || v === "en" || v === "he";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
    // No saved choice yet: use the language the server suggested from the
    // visitor's region (see index.html bootstrap), else Arabic.
    const suggested = (window as { __kahrabaLang?: string }).__kahrabaLang;
    if (isLang(suggested)) return suggested;
    return "ar";
  });

  const dir = dirOf(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  // Cycle ar → he → en → ar
  const toggleLang = useCallback(
    () =>
      setLangState((l) => (l === "ar" ? "he" : l === "he" ? "en" : "ar")),
    []
  );

  const t = useCallback(
    (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] ?? entry.en;
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

// Helper: pick the localized product/category name. Falls back gracefully:
// requested language → Arabic → English (base `name`).
export function localized<
  T extends { name: string; name_ar?: string | null; name_he?: string | null }
>(item: T, lang: Lang): string {
  if (lang === "ar" && item.name_ar) return item.name_ar;
  if (lang === "he" && item.name_he) return item.name_he;
  return item.name;
}
