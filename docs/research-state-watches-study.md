# حالة البحث المعمق — دراسة الساعات مقابل الملابس (نقطة حفظ)

> **الغرض:** حفظ كل نتائج البحث حتى الآن لاستكمال العمل لاحقاً. آخر تحديث: 2026-07-03 ~17:40 UTC.
> **الحالة:** أوقف البحث بطلب المستخدم بعد اكتمال مراحل Scope + Search + Fetch كاملة، واكتمال التحقق (Verify) جزئياً: 3 ادعاءات تحقق عدائي كامل + تحقق يدوي بمطابقة الاقتباسات لمعظم البقية. مرحلة التوليف (Synthesize) لم تُنفذ بعد.

## كيف نكمل لاحقاً

- **إن كانت نفس الجلسة حية:** استئناف الـ workflow من الكاش:
  `Workflow({scriptPath: ".../deep-research-wf_704a5324-01e.js", resumeFromRunId: "wf_704a5324-01e"})`
- **إن كانت جلسة جديدة:** لا حاجة لإعادة البحث — كل الادعاءات والمصادر محفوظة أدناه؛ المتبقي فقط: (أ) تحقق عدائي اختياري للادعاءات الموسومة «تحقق يدوي»، (ب) التوليف والكتابة النهائية في `watches-vs-clothing-meta-strategy.md`.

## إحصاءات الجولة

- 5 زوايا بحث ← 22 مصدراً ← 25 ادعاءً مستخرجاً باقتباس حرفي
- 3 مؤكدة بتصويت عدائي (3-0, 3-0, 2-0) · 0 مدحوضة · 22 تحققت يدوياً بمطابقة الاقتباس عبر البحث المفهرس (WebFetch محجوب 403 على facebook.com/transparency.meta.com/المدونات من هذه البيئة)

---

## أولاً: الادعاءات المؤكدة بالتحقق العدائي الكامل

1. **حقول الـ variants حسب الفئة** (3-0) — «Variant attributes depend on your item's category, but can include size, color, material, pattern, gender or additional attributes such as fit, edition or flavor.»
   المصدر: facebook.com/business/help/363060785327110
   ⟵ الساعة تتـvariant على material (السوار/الهيكل) وcolor/pattern (المينا) — ليس المقاس فقط.

2. **قاعدة item_group_id** (3-0) — «Enter the same group ID in this field for all variants of the same product.» — كل variant سطر مستقل بـ id فريد، والمجموعة تُربط بـ item_group_id مشترك. نفس المصدر.

3. **تقسيم Advantage+ Catalog بالفئات داخل كتالوج واحد** (2-0) — «Rather than showing individual items, you can segment the items in your ads by specific categories (for example, swimwear) or brands.»
   المصدر: facebook.com/business/help/217594425462043

## ثانياً: ادعاءات تحققت يدوياً (الاقتباس وُجد حرفياً في نسخ مفهرسة للمصدر)

### صفحة الـ variants الرسمية (help/363060785327110)
- عند ضبط الـ variants صح، الزبون الذي ينقر منتجاً بالإعلان/المتجر «may see the other variants on its product page» ✅
- «The item_group_id should have the same value across all sizes and colors, and images and external links should match the color of the item» ✅ (صورة كل variant تطابق لونه — قاعدة إلزامية)
- عمود Variants في Commerce Manager → Items (تفصيلة UI) — ⚠️ لم تُطابَق حرفياً؛ منخفضة الأهمية.
- «يظهر variant واحد فقط لكل مجموعة بالإعلانات» — ⚠️ مدعوم منطقياً بالتوثيق لكن بلا اقتباس حرفي مؤكد.

### صفحة الفئات في Advantage+ (help/217594425462043)
- التقسيم يُبنى على حقول brand / product_type / google_product_category ✅ («choose whether to show items by brand, product type or Google product category»)
- لكل فئة headline وdestination URL خاصين ✅ («give each category a headline that appears in your ads and a destination URL»)
- التخصيص الشخصي: «customers will see four categories that fit their likes and buying intentions» ✅
- «التعديلات تنعكس على الكتالوج نفسه» — ⚠️ غير مؤكد حرفياً.

### سياسة الملكية الفكرية (transparency.meta.com — third-party-infringement) — **كلها تأكدت** ✅
- «Ads may not contain content that infringes upon or violates the intellectual property rights of any third party, including copyright, trademark»
- تعريف السلعة المقلدة: «a knock-off or replica version of another company's product that usually copies the trademarked name, logo, and/or **distinctive features**» ⟵ **ساعة بلا لوغو يمكن أن تُعد مقلدة إذا قلّدت التصميم المميز** (مثل تصميم Rolex Oyster بلا شعار)
- المنع يشمل knockoffs وreplicas وليس النسخ الحرفي فقط
- «Ads that are likely to confuse people about the source, sponsorship or affiliation» ممنوعة — الإيحاء بالانتماء لبراند كافٍ للمخالفة
- الإنفاذ بقناتين: بلاغ من صاحب الحق **أو** رصد استباقي من ميتا («or because there are signs that the ad may infringe») ⟵ لا تحتاج بلاغاً لتُضرب

### كتالوج واحد أم متعدد (socioh + ميتا الرسمية help/376573243388834) — ✅
- «Facebook strongly recommends using just one catalog for all your advertising requirements (ads and Shop)»
- تعلم الكتالوج تراكمي ويُفقد عند إنشاء كتالوج جديد: «if you create a new catalog, Meta has to start the learning process all over again... that catalog will have none of the learnings from your past events»
- Product Sets داخل Commerce Manager هي الأداة المقصودة للتقسيم «without having to create multiple catalogs»
- كتالوج واحد لكل بكسل: «It's best to use one Catalogue per Meta Pixel... multiple catalogues... match rate will appear lower»
- الكتالوج الواحد «helps keep your items' Meta pixel event data from being split, expanding your audience size»

### هيكلية الحملات (jonloomer.com/meta-advertising-strategy) — ✅
- «spend more time consolidating than fragmenting into new campaigns... your goal should be to avoid it»
- Auction Overlap: مجموعات/حملات تصل نفس الناس = «an attempt to compete against yourself in the ad auction»
- «In most cases, you can get away with a single ad set in a campaign»
- المثالية: حملة واحدة + مجموعة واحدة — كل الميزانية بمجرى واحد، خروج أسرع من مرحلة التعلم
- القيود على الاستهداف/المواضع عادة عكسية — اترك الخوارزمية تجد المشتري

## ثالثاً: اكتشافات سد الفجوات (بحث إضافي بالحلقة الرئيسية)

1. **واتساب: كتالوج واحد فقط لكل WABA** — «Only 1 Catalogue can be associated with a WABA... the same catalog can belong to multiple phone numbers» (توثيق 360dialog/chatarmin/interakt المبني على توثيق ميتا الرسمي).
   ⟵ **الحجة التقنية القاطعة ضد فصل كتالوج الساعات**: لو فصلنا، بوت الواتساب لا يستطيع إرسال Product Messages من كتالوجين. Multi-Product Message: حتى 30 منتجاً بأقسام sections من الكتالوج الموصول — يعني قسم «ساعات» وقسم «ملابس» برسالة واحدة ممكن.

2. **Benchmarks (WordStream/Lebesgue/TripleWhale/rule1 — بيانات 2025-2026):**
   - ملابس/موضة: CPC ~$0.45 (الأرخص) · CTR ~1.59-2.84% · CVR ~3.26% · CPA ~$21.47 · ROAS ~2.19x
   - مجوهرات/إكسسوارات (تشمل الساعات): CPM ~$9.36 — أغلى وصولاً (حتى 4x مقابل الملابس ببعض التقارير) لكن نية شراء أعلى
   - متوسط المنصة 2025: CPC $0.30 · CTR 1.5% · ROAS ~2x
   ⟵ الساعات ليست «ملابس أرخص» إعلانياً — تحتاج AOV/هامش أعلى لتعويض CPM الأغلى؛ يدعم إبقاءها حملة منفصلة تُقاس لحالها.

3. **COD بالمنطقة (go-globe/shorages/EasySell/Bain):** ~20% من طلبات COD ترتجع (RTO)، ومنصات بالمنطقة ترى رفضاً >30%؛ مرتجعات COD أعلى بـ 19 نقطة من البطاقات (~8%)؛ تفضيل COD بالمنطقة ينخفض (41%→20% خلال 4 سنوات ببعض الأسواق لكن السعودية 72% ومصر 51%). لا بيانات معزولة لفئة الساعات تحديداً — تُذكر كفجوة بيانات في الدراسة.

## رابعاً: مسودة القرار (لتُختبر عند التوليف النهائي)

| المستوى | القرار المبدئي | الدليل الحاكم |
|---|---|---|
| Business Manager | **واحد مشترك** | لا دليل على أي منفعة من الفصل؛ التوثيق يبني كل شيء تحت Portfolio واحد |
| Pixel/Dataset | **واحد مشترك** | كتالوج واحد لكل بكسل + تجميع الإشارات يكبر الجماهير ويرفع match rate |
| الكتالوج | **واحد مشترك + Product Set «ساعات» وProduct Set «ملابس»** | توصية ميتا الرسمية + فقدان التعلم عند الفصل + **قيد الكتالوج الواحد لكل WABA (قاطع)** |
| الحملات | **منفصلة: حملة ملابس ← لاحقاً حملة ساعات** | فئة اقتصادية مختلفة (CPM/AOV/هامش) تحتاج قياساً مستقلاً؛ لكن داخل كل حملة: توحيد لا تفتيت (Loomer) وبحذر من auction overlap على نفس الجمهور النسائي |
| البوت/الفلو | **نظام واحد، فلو فرعي للساعات** | 80% من المكونات محايدة للفئة (تحليل النظام المرجعي بالدراسة)؛ الفرق: لا سؤال مقاس + اللون زوج (مينا، سوار) |
| التسلسل | **ملابس أولاً (شهر 1-2) ثم ساعات (بعد استقرار كلفة الرسالة)** | ميزانية $20-30/يوم تكفي مجموعتين فقط (قاعدة الـ 50) — إدخال الساعات مبكراً يشتت التعلم |

## خامساً: المتبقي للجلسة القادمة

1. (اختياري) تحقق عدائي للادعاءات الموسومة ⚠️ أعلاه.
2. فجوات لم تُغلق: أمثلة GitHub لسكريبتات كتالوج متعدد الفئات (المحور 8)؛ بيانات COD معزولة للساعات (المحور 7 جزئياً)؛ google_product_category الرسمي للساعات (المتوقع: Apparel & Accessories > Jewelry > Watches — يحتاج تثبيتاً من مواصفات الحقول الرسمية).
3. التوليف: إكمال `watches-vs-clothing-meta-strategy.md` — الخلاصة التنفيذية، جدول القرار النهائي، مثال feed CSV (ساعة: مينا × سوار مقابل بلوزة: لون × مقاس)، هيكلية الحملات والميزانية بشروط انتقال رقمية، قواعد أمان العلامات للساعات، خطة 90 يوم محدثة، المراجع.

## المصادر الرئيسية المجموعة

- https://www.facebook.com/business/help/363060785327110 (الـ variants — primary)
- https://www.facebook.com/business/help/217594425462043 (فئات Advantage+ — primary)
- https://www.facebook.com/business/help/376573243388834 (نصيحة الكتالوج الواحد — primary)
- https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/third-party-infringement/ (سياسة التقليد — primary)
- https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/copyright-and-trademarks/ (primary)
- https://developers.facebook.com/docs/marketing-api/catalog/guides/product-variants/ (Marketing API variants)
- https://developers.facebook.com/documentation/business-messaging/whatsapp/catalogs/multi-product-messages/ (MPM)
- https://socioh.com/blog/dynamic-ads-on-meta-should-i-have-one-or-multiple-catalogs/ (كتالوج واحد/متعدد)
- https://www.jonloomer.com/meta-advertising-strategy/ (توحيد الحملات)
- https://chatarmin.com/en/blog/whatsapp-business-catalog + https://docs.360dialog.com/docs/waba-messaging/products-and-catalogs (كتالوج واحد لكل WABA)
- https://www.wordstream.com/blog/facebook-ads-benchmarks-2025 + https://lebesgue.io/facebook-ads/facebook-benchmarks-by-industry-ctr-cpm-cr-and-cac + https://www.triplewhale.com/blog/facebook-ads-benchmarks (benchmarks)
- https://www.go-globe.com/cash-on-delivery-in-middle-east-statistics-and-trends-infographic/ + https://www.shorages.com/blog/the-state-of-cash-on-delivery-in-the-uae (COD)
