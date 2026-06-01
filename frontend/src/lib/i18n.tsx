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
  brand: { ar: "كهربا بلس", en: "Electrical Plus", he: "כהרבא פלוס" },
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
  nav_solar: { ar: "حاسبة الطاقة", en: "Solar Calculator", he: "מחשבון סולארי" },
  solar_title: {
    ar: "حاسبة نظام الطاقة الشمسية",
    en: "Solar System Calculator",
    he: "מחשבון מערכת סולארית",
  },
  solar_hint: {
    ar: "احسب حجم الألواح والبطارية والمنظّم اللازم لاحتياجك",
    en: "Estimate the panel, battery and controller you need",
    he: "חשב את הפאנל, הסוללה והבקר הדרושים",
  },
  solar_loads: { ar: "الأحمال (واط × ساعات)", en: "Loads (watts × hours)", he: "עומסים (וואט × שעות)" },
  solar_watts: { ar: "واط", en: "Watts", he: "וואט" },
  solar_hours: { ar: "ساعات/يوم", en: "Hours/day", he: "שעות/יום" },
  solar_add_load: { ar: "إضافة حمل", en: "Add load", he: "הוסף עומס" },
  solar_sun_hours: { ar: "ساعات الشمس", en: "Sun hours", he: "שעות שמש" },
  solar_voltage: { ar: "جهد النظام", en: "System voltage", he: "מתח מערכת" },
  solar_autonomy: { ar: "أيام احتياطية", en: "Backup days", he: "ימי גיבוי" },
  solar_panel: { ar: "ألواح شمسية", en: "Solar panels", he: "פאנלים סולאריים" },
  solar_battery: { ar: "البطارية", en: "Battery", he: "סוללה" },
  solar_controller: { ar: "منظّم الشحن", en: "Charge controller", he: "בקר טעינה" },
  solar_daily: { ar: "الاستهلاك اليومي", en: "Daily use", he: "צריכה יומית" },
  solar_per_day: { ar: "يوم", en: "day", he: "יום" },
  scroll_top: { ar: "العودة للأعلى", en: "Scroll to top", he: "חזרה למעלה" },
  theme_light: { ar: "الوضع الفاتح", en: "Light mode", he: "מצב בהיר" },
  theme_dark: { ar: "الوضع الليلي", en: "Dark mode", he: "מצב כהה" },
  solar_shop: { ar: "تسوّق منتجات الطاقة الشمسية", en: "Shop solar products", he: "קנה מוצרים סולאריים" },
  solar_disclaimer: {
    ar: "نتيجة تقريبية للإرشاد فقط — تواصل معنا لتصميم دقيق.",
    en: "Rough estimate for guidance only — contact us for an exact design.",
    he: "הערכה כללית בלבד — צרו קשר לתכנון מדויק.",
  },
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
  why_us: { ar: "لماذا كهربا بلس؟", en: "Why Electrical Plus?", he: "למה כהרבא פלוס?" },
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
  compare: { ar: "قارن", en: "Compare", he: "השוואה" },
  compare_add: { ar: "أضف للمقارنة", en: "Add to compare", he: "הוסף להשוואה" },
  compare_empty: {
    ar: "لم تختر منتجات للمقارنة بعد",
    en: "No products selected to compare yet",
    he: "לא נבחרו מוצרים להשוואה",
  },
  compare_cheapest: { ar: "الأرخص", en: "cheapest", he: "הזול ביותר" },
  clear: { ar: "مسح", en: "Clear", he: "נקה" },
  no_favorites: {
    ar: "لا توجد منتجات في المفضلة بعد",
    en: "No favorites yet",
    he: "אין מועדפים עדיין",
  },
  out_of_stock: { ar: "غير متوفر", en: "Out of stock", he: "אזל מהמלאי" },
  in_stock: { ar: "متوفر", en: "In stock", he: "במלאי" },
  notify_title: {
    ar: "نبّهني عند توفّره",
    en: "Notify me when it's back",
    he: "עדכנו אותי כשחוזר למלאי",
  },
  notify_btn: { ar: "نبّهني", en: "Notify me", he: "עדכנו אותי" },
  notify_done: {
    ar: "سننبّهك عند توفّر المنتج 🔔",
    en: "We'll email you when it's back 🔔",
    he: "נעדכן אותך כשהמוצר יחזור 🔔",
  },
  bestseller: { ar: "الأكثر مبيعاً", en: "Bestseller", he: "רב מכר" },
  low_stock_left: {
    ar: "بقي القليل فقط",
    en: "Only a few left",
    he: "נותרו מעט",
  },
  free_ship_unlocked: {
    ar: "حصلت على شحن مجاني!",
    en: "You unlocked free shipping!",
    he: "קיבלת משלוח חינם!",
  },
  free_ship_add: { ar: "أضف", en: "Add", he: "הוסף" },
  free_ship_get: {
    ar: "لتحصل على شحن مجاني",
    en: "to get free shipping",
    he: "כדי לקבל משלוח חינם",
  },
  specifications: { ar: "المواصفات", en: "Specifications", he: "מפרט" },
  description: { ar: "الوصف", en: "Description", he: "תיאור" },
  reviews: { ar: "التقييمات", en: "Reviews", he: "ביקורות" },
  related_products: { ar: "منتجات ذات صلة", en: "Related Products", he: "מוצרים קשורים" },
  fbt_title: {
    ar: "يُشترى عادةً معاً",
    en: "Frequently bought together",
    he: "נקנים יחד לעיתים קרובות",
  },
  fbt_total: { ar: "الإجمالي", en: "Total", he: 'סה"כ' },
  fbt_add: { ar: "أضف المحدد للسلة", en: "Add selected to cart", he: "הוסף לעגלה" },
  fbt_added: { ar: "أُضيفت للسلة", en: "Added to cart", he: "נוסף לעגלה" },
  qa_title: { ar: "أسئلة وأجوبة", en: "Questions & Answers", he: "שאלות ותשובות" },
  qa_ask: { ar: "اسأل سؤالاً", en: "Ask a question", he: "שאל שאלה" },
  qa_placeholder: {
    ar: "اكتب سؤالك عن هذا المنتج...",
    en: "Ask about this product...",
    he: "שאל על המוצר הזה...",
  },
  qa_submit: { ar: "إرسال", en: "Submit", he: "שלח" },
  qa_sent: {
    ar: "تم إرسال سؤالك — سنجيب قريباً",
    en: "Your question was sent — we'll answer soon",
    he: "השאלה נשלחה — נענה בקרוב",
  },
  qa_empty: {
    ar: "لا توجد أسئلة بعد. كن أول من يسأل!",
    en: "No questions yet. Be the first to ask!",
    he: "אין שאלות עדיין. היה הראשון לשאול!",
  },
  qa_inbox: {
    ar: "أسئلة بانتظار الإجابة",
    en: "Questions awaiting answers",
    he: "שאלות הממתינות למענה",
  },
  qa_answer_placeholder: {
    ar: "اكتب الإجابة...",
    en: "Write an answer...",
    he: "כתוב תשובה...",
  },
  recently_viewed: { ar: "شاهدت مؤخراً", en: "Recently Viewed", he: "נצפו לאחרונה" },
  brand_label: { ar: "العلامة", en: "Brand", he: "מותג" },
  sku_label: { ar: "رمز المنتج", en: "SKU", he: 'מק"ט' },
  product_number: { ar: "رقم المنتج", en: "Product No.", he: "מספר מוצר" },
  quantity: { ar: "الكمية", en: "Quantity", he: "כמות" },
  size: { ar: "المقاس", en: "Size", he: "מידה" },
  color: { ar: "اللون", en: "Color", he: "צבע" },
  material: { ar: "الخامة", en: "Material", he: "חומר" },
  select_options: {
    ar: "اختر المقاس واللون",
    en: "Select options",
    he: "בחר אפשרויות",
  },
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
  guest_checkout_note: {
    ar: "لا حاجة لإنشاء حساب — اطلب كزائر وادفع عند الاستلام",
    en: "No account needed — check out as a guest and pay on delivery",
    he: "אין צורך בחשבון — בצע הזמנה כאורח ושלם בעת קבלה",
  },
  trust_secure: { ar: "دفع آمن", en: "Secure checkout", he: "תשלום מאובטח" },
  trust_cod: { ar: "الدفع عند الاستلام", en: "Cash on delivery", he: "תשלום במזומן" },
  trust_genuine: { ar: "منتجات أصلية", en: "Genuine products", he: "מוצרים מקוריים" },
  trust_returns: { ar: "إرجاع سهل", en: "Easy returns", he: "החזרות קלות" },
  order_summary: { ar: "ملخص الطلب", en: "Order Summary", he: "סיכום הזמנה" },
  discount: { ar: "الخصم", en: "Discount", he: "הנחה" },
  coupon_placeholder: { ar: "كود الخصم", en: "Discount code", he: "קוד הנחה" },
  coupon_apply: { ar: "تطبيق", en: "Apply", he: "החל" },
  coupon_err_invalid: {
    ar: "كود غير صحيح",
    en: "Invalid code",
    he: "קוד לא תקין",
  },
  coupon_err_expired: { ar: "انتهت صلاحية الكود", en: "Code expired", he: "הקוד פג" },
  coupon_err_exhausted: {
    ar: "تم استنفاد الكود",
    en: "Code fully used",
    he: "הקוד נוצל",
  },
  coupon_err_inactive: { ar: "كود غير مُفعّل", en: "Code inactive", he: "הקוד לא פעיל" },
  coupon_err_min_subtotal: {
    ar: "السلة أقل من الحد المطلوب للكود",
    en: "Cart below the code's minimum",
    he: "העגלה מתחת למינימום של הקוד",
  },
  // Order confirmation / track
  order_placed: { ar: "تم استلام طلبك!", en: "Order Placed!", he: "ההזמנה התקבלה!" },
  order_placed_d: {
    ar: "شكراً لك. سنتواصل معك لتأكيد الطلب.",
    en: "Thank you. We'll contact you to confirm.",
    he: "תודה. ניצור איתך קשר לאישור ההזמנה.",
  },
  order_number: { ar: "رقم الطلب", en: "Order Number", he: "מספר הזמנה" },
  invoice: { ar: "فاتورة", en: "Invoice", he: "חשבונית" },
  invoice_print: { ar: "طباعة الفاتورة", en: "Print invoice", he: "הדפס חשבונית" },
  invoice_view: { ar: "عرض الفاتورة", en: "View invoice", he: "צפה בחשבונית" },
  invoice_billed_to: { ar: "فاتورة إلى", en: "Billed to", he: "חשבונית עבור" },
  invoice_thanks: {
    ar: "شكراً لتسوّقك من كهربا بلس!",
    en: "Thank you for shopping with Electrical Plus!",
    he: "תודה שקנית בכהרבא פלוס!",
  },
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
  reorder: { ar: "اطلب مرة أخرى", en: "Order again", he: "הזמן שוב" },
  reorder_done: {
    ar: "أُضيفت منتجات الطلب إلى السلة",
    en: "The order's items were added to your cart",
    he: "פריטי ההזמנה נוספו לעגלה",
  },
  reorder_unavailable: {
    ar: "منتجات هذا الطلب غير متوفرة حالياً",
    en: "This order's products aren't available right now",
    he: "מוצרי ההזמנה אינם זמינים כעת",
  },
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
  sales_14d: { ar: "المبيعات (آخر 14 يوم)", en: "Sales (last 14 days)", he: "מכירות (14 ימים)" },
  no_sales_yet: { ar: "لا توجد مبيعات بعد", en: "No sales yet", he: "אין מכירות עדיין" },
  top_products: { ar: "الأكثر مبيعاً", en: "Top products", he: "המוצרים המובילים" },
  no_data: { ar: "لا توجد بيانات", en: "No data", he: "אין נתונים" },
  add_product: { ar: "إضافة منتج", en: "Add Product", he: "הוסף מוצר" },
  images: { ar: "الصور", en: "Images", he: "תמונות" },
  images_uploaded: { ar: "تم رفع الصور", en: "Images uploaded", he: "התמונות הועלו" },
  primary_image: { ar: "رئيسية", en: "Primary", he: "ראשית" },
  make_primary: { ar: "اجعلها رئيسية", en: "Make primary", he: "הפוך לראשית" },
  variants: { ar: "المتغيّرات", en: "Variants", he: "וריאציות" },
  no_variants: {
    ar: "لا توجد متغيّرات. أضف مقاسات أو ألوان.",
    en: "No variants yet. Add sizes or colors.",
    he: "אין וריאציות עדיין. הוסף מידות או צבעים.",
  },
  variant_need_attr: {
    ar: "أدخل مقاس أو لون أو خامة على الأقل",
    en: "Enter at least a size, color, or material",
    he: "הזן לפחות מידה, צבע או חומר",
  },
  save_first_for_variants: {
    ar: "احفظ المنتج أولاً لإضافة متغيّرات",
    en: "Save the product first to add variants",
    he: "שמור את המוצר תחילה כדי להוסיף וריאציות",
  },
  // CSV import
  import_csv: { ar: "استيراد CSV", en: "Import CSV", he: "ייבוא CSV" },
  import_hint: {
    ar: "ارفع ملف CSV لإنشاء أو تحديث منتجات دفعة واحدة. يُطابَق بالـ SKU.",
    en: "Upload a CSV to create or update many products at once. Matched by SKU.",
    he: "העלה CSV ליצירה או עדכון של מוצרים רבים בבת אחת. מותאם לפי מק\"ט.",
  },
  import_choose_file: { ar: "اختر ملف", en: "Choose file", he: "בחר קובץ" },
  export_csv: { ar: "تصدير CSV", en: "Export CSV", he: "ייצוא CSV" },
  import_sample: { ar: "نموذج", en: "Load sample", he: "טען דוגמה" },
  import_preview: { ar: "معاينة", en: "Preview", he: "תצוגה מקדימה" },
  import_commit: { ar: "استيراد", en: "Import", he: "ייבא" },
  import_total: { ar: "الإجمالي", en: "Total", he: 'סה"כ' },
  import_valid: { ar: "صالح", en: "Valid", he: "תקין" },
  import_errors: { ar: "أخطاء", en: "Errors", he: "שגיאות" },
  import_columns: { ar: "الأعمدة المكتشفة", en: "Detected columns", he: "עמודות שזוהו" },
  import_row: { ar: "صف", en: "Row", he: "שורה" },
  import_done: { ar: "تم الاستيراد", en: "Import complete", he: "הייבוא הושלם" },
  import_created: { ar: "جديد", en: "created", he: "נוצרו" },
  import_updated: { ar: "محدّث", en: "updated", he: "עודכנו" },
  import_skipped: { ar: "متخطّى", en: "skipped", he: "דולגו" },
  // Catalog health
  health_tab: { ar: "صحة الكتالوج", en: "Catalog Health", he: "תקינות הקטלוג" },
  health_title: { ar: "اكتمال الكتالوج", en: "Catalog completeness", he: "שלמות הקטלוג" },
  health_complete: { ar: "منتج مكتمل", en: "complete", he: "שלמים" },
  health_all_good: {
    ar: "ممتاز! كل المنتجات مكتملة البيانات.",
    en: "Great! All products have complete data.",
    he: "מצוין! לכל המוצרים יש נתונים מלאים.",
  },
  health_no_image: { ar: "بدون صورة", en: "Missing image", he: "ללא תמונה" },
  health_no_price: { ar: "بدون سعر", en: "Missing price", he: "ללא מחיר" },
  health_no_desc: { ar: "بدون وصف", en: "Missing description", he: "ללא תיאור" },
  health_no_category: { ar: "بدون قسم", en: "No category", he: "ללא קטגוריה" },
  health_out_of_stock: { ar: "نفد المخزون", en: "Out of stock", he: "אזל מהמלאי" },
  health_hint: {
    ar: "اضغط على أي منتج لتعديله وإكمال بياناته.",
    en: "Click a product to edit and complete its data.",
    he: "לחץ על מוצר כדי לערוך ולהשלים את הנתונים.",
  },
  demand_title: {
    ar: "طلب على منتجات نافدة (نبّهني)",
    en: "Demand for out-of-stock items (notify requests)",
    he: "ביקוש למוצרים שאזלו (בקשות עדכון)",
  },
  demand_waiting: { ar: "بانتظار", en: "waiting", he: "ממתינים" },
  // Cost / accounting
  cost: { ar: "التكلفة", en: "Cost", he: "עלות" },
  cost_hint: {
    ar: "تكلفة الوحدة — تُستخدم لحساب الربح",
    en: "Unit cost — used to calculate profit",
    he: "עלות יחידה — לחישוב רווח",
  },
  acc_tab: { ar: "المحاسبة", en: "Accounting", he: "הנהלת חשבונות" },
  acc_title: {
    ar: "المحاسب الذكي",
    en: "Smart Accountant",
    he: "רואה החשבון החכם",
  },
  acc_revenue: { ar: "الإيرادات", en: "Revenue", he: "הכנסות" },
  acc_cogs: { ar: "تكلفة البضاعة", en: "Cost of goods (COGS)", he: "עלות מכר" },
  acc_gross_profit: { ar: "الربح الإجمالي", en: "Gross profit", he: "רווח גולמי" },
  acc_margin: { ar: "هامش الربح", en: "Profit margin", he: "שולי רווח" },
  acc_aov: { ar: "متوسط قيمة الطلب", en: "Avg order value", he: "ערך הזמנה ממוצע" },
  acc_discounts: { ar: "الخصومات", en: "Discounts given", he: "הנחות שניתנו" },
  acc_top_profit: { ar: "الأكثر ربحاً", en: "Most profitable", he: "הרווחיים ביותר" },
  acc_low_profit: { ar: "الأقل ربحاً", en: "Least profitable", he: "הפחות רווחיים" },
  acc_missing_cost: {
    ar: "{n} منتج بدون تكلفة محدّدة — أضف التكلفة لحساب ربح أدق.",
    en: "{n} products have no cost set — add costs for accurate profit.",
    he: "ל-{n} מוצרים אין עלות — הוסף עלויות לחישוב רווח מדויק.",
  },
  // Coupons admin
  coupons: { ar: "كوبونات الخصم", en: "Coupons", he: "קופונים" },
  coupons_hint: {
    ar: "أنشئ أكواد خصم يطبّقها العملاء عند الدفع.",
    en: "Create discount codes customers apply at checkout.",
    he: "צור קודי הנחה שלקוחות מחילים בתשלום.",
  },
  coupons_none: { ar: "لا توجد كوبونات بعد", en: "No coupons yet", he: "אין קופונים עדיין" },
  coupon_min: { ar: "حد أدنى", en: "Min", he: "מינ׳" },
  coupon_max_uses: { ar: "حد الاستخدام", en: "Max uses", he: "שימושים מקס׳" },
  coupon_expires: { ar: "تاريخ الانتهاء", en: "Expires", he: "תפוגה" },
  coupon_used: { ar: "استُخدم", en: "used", he: "נוצל" },
  coupon_need_fields: {
    ar: "أدخل الكود وقيمة الخصم",
    en: "Enter a code and discount value",
    he: "הזן קוד וערך הנחה",
  },
  active: { ar: "مُفعّل", en: "Active", he: "פעיל" },
  inactive: { ar: "موقوف", en: "Inactive", he: "כבוי" },
  add: { ar: "إضافة", en: "Add", he: "הוסף" },
  edit: { ar: "تعديل", en: "Edit", he: "עריכה" },
  delete: { ar: "حذف", en: "Delete", he: "מחיקה" },
  save_product: { ar: "حفظ المنتج", en: "Save Product", he: "שמור מוצר" },
  // Footer
  footer_about: { ar: "عن المتجر", en: "About", he: "אודות" },
  footer_about_d: {
    ar: "كهربا بلس متجرك المتخصص بالإلكترونيات والقطع الكهربائية، نخدم العملاء محلياً ودولياً.",
    en: "Electrical Plus is your specialized store for electronics and electrical components, serving customers locally and worldwide.",
    he: "כהרבא פלוס היא חנות מתמחה באלקטרוניקה וברכיבי חשמל, המשרתת לקוחות מקומית ובעולם.",
  },
  footer_links: { ar: "روابط سريعة", en: "Quick Links", he: "קישורים מהירים" },
  about_title: { ar: "من نحن", en: "About Us", he: "אודותינו" },
  about_story_title: { ar: "قصتنا", en: "Our Story", he: "הסיפור שלנו" },
  about_story: {
    ar: "بدأت كهربا بلس بشغف بسيط بالإلكترونيات، وكبرت لتصبح متجراً متخصصاً يوفّر القطع الكهربائية والإلكترونية الأصلية بأسعار منافسة. نخدم الهواة والمحترفين والشركات محلياً ودولياً، ونحرص على الجودة وسرعة التوصيل ودعم فني يساعدك على اختيار القطعة الصحيحة.",
    en: "Electrical Plus started from a simple passion for electronics and grew into a specialized store offering genuine electrical and electronic parts at competitive prices. We serve hobbyists, professionals and businesses locally and worldwide, with a focus on quality, fast delivery, and technical support that helps you pick the right part.",
    he: "כהרבא פלוס נולדה מתשוקה פשוטה לאלקטרוניקה והפכה לחנות מתמחה המציעה חלקי חשמל ואלקטרוניקה מקוריים במחירים תחרותיים. אנו משרתים חובבים, אנשי מקצוע ועסקים מקומית ובעולם, עם דגש על איכות, משלוח מהיר ותמיכה טכנית.",
  },
  faq_title: { ar: "الأسئلة الشائعة", en: "FAQ", he: "שאלות נפוצות" },
  faq_q1: { ar: "هل أحتاج حساباً للشراء؟", en: "Do I need an account to buy?", he: "האם צריך חשבון כדי לקנות?" },
  faq_a1: {
    ar: "لا. يمكنك الطلب كزائر والدفع عند الاستلام، ويصلك رقم طلب لتتبّعه.",
    en: "No. You can check out as a guest and pay on delivery; you'll get an order number to track it.",
    he: "לא. אפשר להזמין כאורח ולשלם בעת קבלה; תקבל מספר הזמנה למעקב.",
  },
  faq_q2: { ar: "كيف أتتبّع طلبي؟", en: "How do I track my order?", he: "איך עוקבים אחר ההזמנה?" },
  faq_a2: {
    ar: "من صفحة «تتبع الطلب» أدخل رقم طلبك لرؤية حالته خطوة بخطوة.",
    en: "Go to the Track Order page and enter your order number to see its status step by step.",
    he: "בעמוד מעקב הזמנה הזן את מספר ההזמנה כדי לראות את הסטטוס.",
  },
  faq_q3: { ar: "ما طرق الدفع المتاحة؟", en: "What payment methods are available?", he: "אילו אמצעי תשלום קיימים?" },
  faq_a3: {
    ar: "الدفع عند الاستلام متاح الآن، والدفع بالبطاقة قريباً.",
    en: "Cash on delivery is available now; card payment is coming soon.",
    he: "תשלום במזומן בעת קבלה זמין כעת; תשלום בכרטיס בקרוב.",
  },
  faq_q4: { ar: "هل الشحن دولي؟", en: "Do you ship internationally?", he: "האם יש משלוח בינלאומי?" },
  faq_a4: {
    ar: "نعم، نشحن محلياً ودولياً، مع شحن مجاني للطلبات فوق 100$.",
    en: "Yes, we ship locally and worldwide, with free shipping on orders over $100.",
    he: "כן, אנו שולחים מקומית ובעולם, עם משלוח חינם בהזמנות מעל 100$.",
  },
  faq_q5: { ar: "هل القطع أصلية ومضمونة؟", en: "Are the parts genuine and guaranteed?", he: "האם החלקים מקוריים ומובטחים?" },
  faq_a5: {
    ar: "كل منتجاتنا أصلية من علامات موثوقة، ونوفّر دعماً فنياً عند الحاجة.",
    en: "All our products are genuine from trusted brands, and we provide technical support when needed.",
    he: "כל המוצרים מקוריים ממותגים אמינים, ואנו מספקים תמיכה טכנית.",
  },
  faq_q6: { ar: "كيف أرجع منتجاً؟", en: "How do I return a product?", he: "איך מחזירים מוצר?" },
  faq_a6: {
    ar: "تواصل معنا خلال 14 يوماً من الاستلام وسنرشدك خلال عملية الإرجاع.",
    en: "Contact us within 14 days of delivery and we'll guide you through the return.",
    he: "צור קשר תוך 14 יום מהקבלה ונלווה אותך בתהליך ההחזרה.",
  },
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
  // Visual search
  visual_search: { ar: "البحث بالصورة", en: "Search by Image", he: "חיפוש לפי תמונה" },
  visual_search_hint: {
    ar: "ارفع صورة منتج — حتى لو غير واضحة أو لقطة من فيديو — ونطابقها لك",
    en: "Upload a product photo — even blurry or a video screenshot — and we'll match it",
    he: "העלה תמונת מוצר — גם מטושטשת או צילום מסך מסרטון — ונמצא התאמה",
  },
  visual_search_upload: {
    ar: "اضغط لرفع صورة",
    en: "Tap to upload an image",
    he: "לחץ להעלאת תמונה",
  },
  visual_search_another: { ar: "صورة أخرى", en: "Try another", he: "תמונה אחרת" },
  visual_search_matching: {
    ar: "نطابق الصورة مع منتجاتنا...",
    en: "Matching against our products...",
    he: "מתאים מול המוצרים שלנו...",
  },
  visual_search_results: { ar: "أقرب النتائج", en: "Closest matches", he: "ההתאמות הקרובות" },
  visual_search_none: {
    ar: "لم نجد منتجاً مطابقاً. جرّب صورة أوضح.",
    en: "No matching product found. Try a clearer photo.",
    he: "לא נמצא מוצר תואם. נסה תמונה ברורה יותר.",
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

// Localized free-text description (product description fields).
export function localizedText(
  item: {
    description?: string | null;
    description_ar?: string | null;
    description_he?: string | null;
  },
  lang: Lang
): string {
  if (lang === "ar" && item.description_ar) return item.description_ar;
  if (lang === "he" && item.description_he) return item.description_he;
  return item.description || "";
}

// Localized order-item name (uses snapshotted name fields on the order).
export function localizedOrderItem(
  item: {
    product_name: string;
    product_name_ar?: string | null;
    product_name_he?: string | null;
  },
  lang: Lang
): string {
  if (lang === "ar" && item.product_name_ar) return item.product_name_ar;
  if (lang === "he" && item.product_name_he) return item.product_name_he;
  return item.product_name;
}
