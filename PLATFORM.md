# 🏬 منصة كهربا بلس / Electrical Plus — المرجع الموحّد (PLATFORM.md)

> **ملف واحد يجمع كل شي**: الميزات، الواجهات، الـAPI، نموذج البيانات، المنطق التجاري، الأمان، النشر — ومطابقة Shopify.
> نشتغل على **موقعين**: ① الموقع المخصّص (هذا المستودع) و② نسخة Shopify. هذا الملف هو المخطّط (blueprint) المشترك بينهما.
>
> العلامة: **كهربا بلس** (ar) · **Electrical Plus** (en) · **כהרבא פלוס** (he) — متجر إلكترونيات وقطع كهربائية.
> آخر تحديث: 2026-06-02

---

## 1) نظرة عامة / Overview

متجر إلكتروني **متعدد اللغات** (عربي/عبري/إنجليزي، RTL) مع **عملة حسب المنطقة**، يعمل كموقع ويب + PWA + تطبيق أصلي (Capacitor) من نفس الكود. يتكوّن من:

- **واجهة المتجر (Storefront)** — للزبائن.
- **لوحة تحكم معزولة (Admin)** — للتاجر، كاملة الصلاحيات، كل تعديل يظهر فوراً.
- **API** — Flask REST، كل البيانات منه (الواجهة لا تثق بأي سعر/مخزون من العميل).

### التقنيات / Stack
| الطبقة | التقنية |
|---|---|
| Backend | Python · Flask · SQLAlchemy · Flask-JWT-Extended · Pillow |
| Frontend | React · TypeScript · Vite · Tailwind · React Router · axios · sonner |
| Mobile | Capacitor (نفس `frontend/dist`) + PWA |
| قاعدة البيانات | SQLite (تطوير) · PostgreSQL (إنتاج عبر `DATABASE_URL`) |
| الاختبار/CI | pytest (65 اختبار) · GitHub Actions (backend tests + frontend lint/build) |

---

## 2) اللغات والعملة / i18n & Currency

- **اللغات**: `ar` (افتراضي RTL) · `he` (RTL) · `en` (LTR). كل النصوص في `frontend/src/lib/i18n.tsx`.
- **اللغة التلقائية حسب الموقع** (`GET /api/geo/lang`): IP إسرائيلي → عبري · فلسطيني/عربي → عربي · غير ذلك → إنجليزي.
- **العملة (عرض فقط)**: الأسعار مخزّنة بالـUSD على السيرفر، وتُعرض:
  - عبري/عربي → **₪ ILS** · إنجليزي → **$ USD** (تحويل وقت العرض في `lib/currency.tsx`).

---

## 3) صفحات المتجر / Storefront Routes

| المسار | الصفحة |
|---|---|
| `/` | الرئيسية (hero، فئات، مميّز، بانر عرض، شوهد مؤخراً) |
| `/shop` | المتجر (فلاتر: قسم/سعر/علامة/متوفّر + فرز + autocomplete) |
| `/product/:slug` | تفاصيل المنتج (معرض سحب، متغيّرات، تقييمات، Q&A، يُشترى معاً، شريط شراء ثابت) |
| `/cart` | السلة (شحن مجاني تدريجي، عدّاد، دفع آمن) |
| `/checkout` | الدفع (عناوين محفوظة، كوبون، quote حي) |
| `/order-confirmation/:orderNumber` | تأكيد الطلب |
| `/track` · `/invoice/:orderNumber` | تتبّع الطلب · فاتورة قابلة للطباعة |
| `/offers` | العروض والمناسبات + المنتجات المخفّضة |
| `/about` · `/faq` | من نحن (إحصائيات) · الأسئلة الشائعة |
| `/favorites` · `/compare` · `/visual-search` | المفضّلة · المقارنة · البحث البصري |
| `/solar-calculator` | حاسبة الطاقة الشمسية |
| `/login` · `/account` | الدخول/التسجيل · حسابي (طلبات/عناوين/ملف) |
| `/admin` | لوحة التحكم (شل معزول، للأدمن فقط) |
| `/robots.txt` · `/sitemap.xml` | SEO (يُولّدان ديناميكياً) |

---

## 4) ميزات المتجر / Storefront Features

- **كتالوج غني**: متغيّرات (مقاس/لون/خامة + سعر إضافي + مخزون مستقل)، صور متعددة، **باركود (قابل للبحث)**، وسوم، رابط فيديو، مواصفات فنية، 3 لغات لكل اسم/وصف.
- **بحث**: نصّي (اسم/SKU/باركود/وسوم بـ3 لغات) + **autocomplete فوري** + **بحث بصري** (مطابقة صورة الزبون عبر perceptual hash، offline).
- **تحويل (كله على بيانات حقيقية، بلا تزييف)**: شريط شحن مجاني، شارات الأكثر مبيعاً/مخزون منخفض، شارات ثقة، شوهد مؤخراً، **يُشترى معاً**، **مقارنة**، **نبّهني عند التوفّر**، **أسئلة وأجوبة**، تقييمات، **كوبونات**، **عروض/مناسبات**.
- **الشراء**: شراء كزائر + دفع عند الاستلام، **عناوين محفوظة** (دفع بضغطة)، فاتورة، **إعادة الطلب**، تتبّع.
- **تجربة**: موبايل (شريط سفلي، شريط شراء ثابت)، PWA، dark mode، motion محترم لـ`prefers-reduced-motion`، حاسبة طاقة.

---

## 5) لوحة التحكم / Admin (شل معزول، كامل الصلاحيات)

> معزولة تماماً عن واجهة المتجر (لا navbar/footer/سلة)، محمية للأدمن فقط، وكل تعديل **يظهر فوراً** (ترويسة `Cache-Control: no-store`).

| التبويب | الصلاحيات |
|---|---|
| لوحة التحكم | إيرادات/طلبات/عملاء/منتجات + رسوم مبيعات + الأكثر مبيعاً |
| المنتجات | CRUD كامل لكل الحقول + **رؤية المخفي** + **تعديل جماعي** (سعر %/ثابت، إظهار/إخفاء) |
| الأقسام | CRUD كامل (حذف آمن يفصل المنتجات) |
| الطلبات | عرض تفصيلي (بنود/عميل/عنوان) + تغيير الحالة + **إرجاع المخزون عند الإلغاء** + **تصدير CSV** |
| المحاسبة | تكلفة/ربح/هامش/AOV + الأكثر/الأقل ربحية |
| استيراد CSV | معاينة + تنفيذ + **تصدير** |
| صحة الكتالوج | نواقص (صور/أسعار/أوصاف) + الرد على الأسئلة + طلب التخزين |
| الكوبونات | CRUD + تفعيل |
| المناسبات/العروض | CRUD + تفعيل + فترة |
| المستخدمون | قائمة + **ترقية/تنزيل** (مع منع تنزيل الذات) |
| المشتركون | قائمة النشرة + **تصدير CSV** |
| المراجعات | حذف/إشراف (يعيد حساب التقييم) |

---

## 6) نموذج البيانات / Data Model (13 جدول)

```
users(id, email⊥, password_hash, first_name, last_name, phone, role[customer|admin], created_at)
addresses(id, user_id→users, full_name, phone, address_line1/2, city, state, postal_code, country, is_default)
categories(id, name/name_ar/name_he, slug⊥, description, icon, parent_id→categories)
products(id, product_number⊥, name/_ar/_he, slug⊥, sku⊥, barcode⊙, brand, tags[json], video_url,
         description/_ar/_he, price, cost(COGS·admin-only), compare_at_price, currency,
         stock_quantity, category_id→categories, image_urls[json], technical_specs[json],
         image_hashes[json], is_featured, is_active, rating_avg, rating_count)
product_variants(id, product_id→products, size, color, color_hex, material, sku, image_url,
                 additional_price, stock_quantity, is_available, sort_order)
reviews(id, product_id→products, user_id→users, rating[1..5], comment)
questions(id, product_id→products, asker_name, body, answer)
orders(id, order_number⊥, user_id?, status[pending|processing|shipped|delivered|cancelled],
       payment_status[unpaid|paid|refunded], payment_method, subtotal, discount, coupon_code,
       shipping_cost, tax, total_amount, currency, customer_name/email/phone,
       shipping_address/city/country, notes, created_at)
order_items(id, order_id→orders, product_id?, product_name/_ar/_he(snapshot), product_image,
            variant_id?, variant_label, quantity, unit_price, unit_cost(COGS·admin-only), subtotal)
coupons(id, code⊥, discount_type[percent|fixed], value, min_subtotal, max_uses, used_count, expires_at, is_active)
promotions(id, title/_ar/_he, subtitle/_ar/_he, image_url, coupon_code, cta_link, starts_at, ends_at, is_active)
stock_notifications(id, product_id→products, email, notified)
subscribers(id, email⊥, created_at)
```
`⊥`=unique · `⊙`=indexed/searchable · `→`=FK · `?`=nullable

---

## 7) واجهة الـAPI / API Endpoints

**عام (Public)**
```
GET  /api/health            GET  /api/config            GET  /api/geo/lang
GET  /api/products          GET  /api/products/<slug>   GET  /api/products/brands
GET  /api/products/<id>/variants     GET  /api/products/<id>/questions
GET  /api/categories        GET  /api/promotions
POST /api/orders            POST /api/orders/quote      GET  /api/orders/track/<order_number>
POST /api/coupons/validate  POST /api/visual-search     POST /api/subscribe
POST /api/products/<id>/notify-stock     POST /api/products/<id>/questions
GET  /robots.txt            GET  /sitemap.xml
```

**مصادقة (Auth)**
```
POST /api/auth/register   POST /api/auth/login   GET/PUT /api/auth/me
GET/POST /api/auth/me/addresses    DELETE /api/auth/me/addresses/<id>
POST /api/products/<id>/reviews   GET /api/orders/mine     (تتطلب JWT)
```

**أدمن (كلها `@admin_required`)**
```
المنتجات:  POST /api/products · PUT/DELETE /api/products/<id> · POST /api/products/bulk
المتغيّرات: POST /api/products/<id>/variants · PUT/DELETE /api/variants/<id>
الأقسام:   POST /api/categories · PUT/DELETE /api/categories/<id>
الطلبات:   GET /api/admin/orders · PUT /api/admin/orders/<id> · GET /api/admin/orders/export
الكوبونات: GET/POST /api/admin/coupons · PUT/DELETE /api/admin/coupons/<id>
العروض:    GET/POST /api/admin/promotions · PUT/DELETE /api/admin/promotions/<id>
المستخدمون: GET /api/admin/users · PUT /api/admin/users/<id>/role
المراجعات: DELETE /api/admin/reviews/<id>
الأسئلة:   GET /api/admin/questions · PUT/DELETE /api/admin/questions/<id>
المشتركون: GET /api/admin/subscribers
التحليلات: GET /api/admin/stats · /admin/accounting · /admin/catalog-health · /admin/notifications
التخزين:   GET /api/admin/stock-notifications · POST .../stock-notifications/<pid>/dismiss
استيراد:   POST /api/admin/import/preview · /admin/import/commit · GET /api/admin/export
الصور:     POST /api/uploads · GET /api/uploads/<file> · POST /api/admin/reindex-images
```

---

## 8) المنطق التجاري والأمان / Business Logic & Security

**حسابات موثوقة من السيرفر (Server-authoritative)**
- السعر والمخزون **دائماً من السيرفر**؛ لا يُوثق بأي مبلغ من العميل.
- المتغيّر: السعر = سعر المنتج + `additional_price`، والمخزون من المتغيّر؛ منتج له متغيّرات **يلزم** اختيار متغيّر.
- خصم الكوبون لا يجعل الإجمالي سالباً (clamp ≥ 0)؛ الشحن المجاني يُحسب على المجموع بعد الخصم.

**حماية التزامن (Atomicity)**
- خصم المخزون **ذرّي ومحمي** (لا بيع زائد تحت الضغط) → 409 عند النفاد.
- عدّ استخدام الكوبون **ذرّي** يحترم `max_uses`.
- **Idempotency**: طلب مطابق خلال 90 ثانية (تحديث/ضغط مزدوج) يرجع نفس الطلب بدل تكرار.

**سرّية وخصوصية**
- **التكلفة (COGS)** لا تُسرّب أبداً للعموم — محصورة بالأدمن (`include_cost`).
- أرقام الطلبات: 8 خانات عشوائية (`secrets`) غير قابلة للتخمين.
- كل مسار أدمن `@admin_required`؛ لا IDOR؛ لا تصعيد صلاحيات (الدور غير قابل للضبط عند التسجيل).

**صلابة الإدخال**
- معالِجات أخطاء عامة: ValueError→400، IntegrityError→409 (SKU مكرّر)، الباقي JSON 500 + rollback.
- تحقّق إيميل، رفض الحقول الفارغة (strip)، clamp للأسعار/المخزون ≥ 0.
- حذف منتج **مباع** = أرشفة (حفظ التاريخ/المحاسبة)؛ غير المباع = حذف بعد تنظيف التوابع.
- إلغاء الطلب **يرجّع المخزون** (مرّة واحدة)، تحقّق حالات الطلب/الدفع من قائمة مسموحة.
- حماية SSRF (إعادة فهرسة الصور)، تحييد حقن صيغ CSV، حد حجم الصور + decompression-bomb.

---

## 9) النشر / Deployment

**متغيّرات البيئة**
```
ENVIRONMENT=production
SECRET_KEY=...            JWT_SECRET_KEY=...        (إلزامية بالإنتاج — fail-fast)
DATABASE_URL=postgresql://...     CORS_ORIGINS=https://yourdomain
VITE_API_URL=https://api.yourdomain/api           (للفرونت)
```
**التشغيل**: `pnpm build` (يولّد `frontend/dist`) ثم `gunicorn src.main:app`؛ Flask يخدم الـSPA. الكاش: `/api/*` و`index.html` = `no-store`؛ أصول `/assets/` (مع hash) = immutable.

---

## 10) مطابقة Shopify / Shopify Parity Map

> كيف تُبنى نفس القدرات على نسخة Shopify (للموقع الثاني). الفكرة: **هذا الكود = المصدر/المرجع**، وShopify = منصة بديلة بنفس الميزات.

| ميزتنا (الموقع العادي) | المقابل في Shopify |
|---|---|
| المنتجات + المتغيّرات + الحقول | Products + Variants + **Metafields** (للباركود/الفيديو/المواصفات/3 لغات عبر Translate&Adapt) |
| الفئات | Collections (يدوية/تلقائية) |
| الكوبونات | Discounts (Automatic/Code) |
| العروض/المناسبات | Marketing / banners عبر **Theme sections** + Discounts |
| السلة/الدفع/الطلبات | Checkout + Orders (مُدار من Shopify) |
| العناوين المحفوظة | Customer accounts (مدمجة) |
| المراجعات / Q&A | تطبيق (Judge.me / Shopify Product Reviews) |
| نبّهني عند التوفّر | تطبيق (Back in Stock) |
| المقارنة / يُشترى معاً / شوهد مؤخراً | أقسام ثيم أو تطبيقات upsell |
| البحث البصري / autocomplete | Search & Discovery app + (Shopify Search APIs) |
| النشرة البريدية | Shopify Email / Klaviyo |
| المحاسبة (ربح/هامش/COGS) | Shopify Analytics + حقل **Cost per item** |
| تعديل جماعي للأسعار | **Bulk editor** المدمج |
| تصدير الطلبات/المنتجات CSV | تصدير CSV مدمج |
| 3 لغات + RTL | **Shopify Markets** + Translate & Adapt + ثيم RTL |
| العملة حسب المنطقة | Shopify Markets (multi-currency) |
| SEO (robots/sitemap/OG) | مدمج تلقائياً في Shopify |
| لوحة تحكم الأدمن | Shopify Admin (جاهزة) |
| الموبايل/PWA | Shopify Shop app / Hydrogen (لواجهة مخصّصة) |

**استراتيجية مقترحة للموقعين**: الموقع العادي يبقى المصدر الكامل والمرن (تحكّم 100%)، وShopify للوصول السريع للسوق. لمزامنة الكتالوج، يمكن لاحقاً كتابة سكربت يصدّر `GET /api/products` ويرفعه عبر Shopify Admin API (Products + Metafields).

---

## 11) ملخّص الجودة / Quality
✅ 65 اختبار pytest · ✅ CI أخضر (tests + lint + build) · ✅ مُراجَع أمنياً (4 مراجعات) · ✅ كل زر أدمن فعليّ وينعكس فوراً.
