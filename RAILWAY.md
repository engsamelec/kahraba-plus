# 🚂 النشر على Railway / Deploy on Railway

دليل خطوة بخطوة لتشغيل **كهربا بلس** على Railway. المشروع مجهّز مسبقاً (Procfile, nixpacks.toml, root requirements) — فالنشر بسيط.

> Flask يخدم الواجهة المبنية (`frontend/dist` مرفوعة جاهزة)، فما في حاجة لبناء الفرونت على Railway.

---

## الخطوات / Steps

### 1) أنشئ المشروع
1. ادخل https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. اختر `engsamelec/kahraba-plus` (والفرع المطلوب).
3. Railway يكتشف Python تلقائياً ويبني عبر `nixpacks.toml` + `Procfile`.

### 2) أضف قاعدة بيانات Postgres
- داخل المشروع: **New → Database → Add PostgreSQL**.
- Railway يضبط `DATABASE_URL` تلقائياً ويربطها بالخدمة (التطبيق يقرأها مباشرة).

### 3) اضبط متغيّرات البيئة (Variables)
في خدمة التطبيق → **Variables** → أضف:
```
ENVIRONMENT      = production
SECRET_KEY       = «نص عشوائي طويل»
JWT_SECRET_KEY   = «نص عشوائي طويل آخر»
CORS_ORIGINS     = https://your-app.up.railway.app   (أو دومينك)
```
> توليد مفتاح عشوائي: `python -c "import secrets; print(secrets.token_hex(32))"`
> `DATABASE_URL` و`PORT` يضبطهما Railway تلقائياً — لا تضفهما يدوياً.

### 4) انشر
- Railway يبني ويشغّل: `gunicorn --chdir backend src.main:app --bind 0.0.0.0:$PORT`.
- أول تشغيل: التطبيق **ينشئ الجداول ويزرع كتالوج تجريبي** تلقائياً.
- افتح الدومين من **Settings → Networking → Generate Domain**.

---

## ✅ بعد النشر — مهم جداً

1. **غيّر/أنشئ أدمن حقيقي** — الافتراضي `admin@kahrabaplus.com / admin123` للتجربة فقط.
   - أسرع طريقة: سجّل حساب جديد من `/register`، ثم رقّه لأدمن من قاعدة البيانات أو عبر أدمن موجود (`PUT /api/admin/users/<id>/role`).
2. **استبدل بيانات التواصل** الحقيقية في `frontend/src/lib/brand.ts` (هاتف/إيميل/عنوان) ثم `pnpm build` وارفع.
3. **ارفع منتجاتك الحقيقية** عبر لوحة التحكم → استيراد CSV.
4. (اختياري) **دومين مخصّص**: Settings → Networking → Custom Domain، وحدّث `CORS_ORIGINS`.

---

## ملاحظات / Notes
- **الكاش**: `/api/*` و`index.html` = `no-store` (تعديلات الأدمن تظهر فوراً)؛ أصول `/assets/` immutable.
- **الصور المرفوعة** (`/api/uploads`) تُخزَّن على قرص الحاوية — وRAILWAY قد يعيد البناء؛ للإنتاج الجاد استخدم تخزين خارجي (S3) أو **Railway Volume** على مسار الرفع.
- **الترقية لـPostgres**: لا تحتاج هجرة يدوية — `db.create_all()` ينشئ الجداول أول تشغيل.
- إذا غيّرت الفرونت: `pnpm build` محلياً وكومت `frontend/dist`، ثم Railway يعيد النشر.

> لتفاصيل كل الميزات والـAPI: راجع **`PLATFORM.md`**.
