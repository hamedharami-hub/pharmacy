# مرحله ۵: نرمال‌سازی شناسه‌های بالینی

## هدف

در این مرحله شناسه‌های بیماری، دارو و محصول از هم تفکیک شدند تا یک برند یا محصول تجاری با خود «دارو» اشتباه نشود و لینک‌های علمی بتوانند از چند برند به یک موجودیت دارویی مشترک برسند.

## مدل هویت‌ها

| نوع | قالب شناسه | نمونه |
|---|---|---|
| Disease | `disease:<canonical-slug>` | `disease:otc-pain-relief` |
| Medicine | `medicine:<canonical-generic-slug>` | `medicine:paracetamol` |
| Product | `product:<stable-product-slug>` | `product:prod-panadol-500` |

`Medicine` از نام ژنریک محصول ساخته می‌شود و `Product` شناسه محصول تجاری فعلی را حفظ می‌کند. بنابراین چند برند می‌توانند به یک Medicine متصل شوند، اما رکورد مطالعه و اطلاعات بسته‌بندی هر Product جدا باقی می‌ماند.

## ممیزی داده‌های موجود

- ۱۲۱ رکورد محصول Shelf بررسی شد.
- ۱۱۹ شناسه محصول یکتا وجود دارد.
- دو شناسه محصول در منبع تکراری هستند: `prod-ventolin-inhaler` و `prod-nexium-24hr`.
- ۱۲۰ نام ژنریک یکتا شناسایی شد.
- `Levothyroxine Sodium` به دو محصول `Eutroxsig` و `Oroxine` متصل شد، بدون اینکه دو رکورد محصول حذف شوند.

تکرارهای محصول در این مرحله حذف نشدند؛ فقط در `CLINICAL_ENTITIES_UNIQUE` و identity layer به‌صورت کنترل‌شده مدیریت می‌شوند تا داده‌های قدیمی و Study Tracker آسیب نبینند.

## Alias Resolution

برای هر Disease، Medicine و Product، aliasهای زیر قابل جست‌وجو هستند:

- نام انگلیسی
- نام فارسی
- شناسه منبع
- نام ژنریک
- ماده مؤثره
- نام برند
- برندهای معادل
- Synonymهای بیماری

تابع اصلی:

```ts
resolveClinicalIdentity(alias, type?)
```

توابع کمکی:

```ts
medicineIdentityId(product)
productIdentityId(product)
diseaseIdentityId(disease)
getProductMedicineId(product)
getMedicineIdentity(id)
getIdentityStats()
```

## اتصال به رجیستری مرکزی

رجیستری مرکزی اکنون موجودیت‌های `medicine` را نیز ثبت می‌کند و رابطه قطعی زیر را برای هر محصول می‌سازد:

```text
Product → has-medicine → Medicine
```

این رابطه از `Product.genericName` ساخته می‌شود و به‌عنوان `verified` ثبت شده است. ارتباط‌های پیشنهادی بیماری و Triage همچنان با وضعیت `suggested` باقی می‌مانند و تحت تأثیر این مرحله به‌صورت خودکار تأیید نمی‌شوند.

## تصمیم مهم درباره شناسه‌های قدیمی

شناسه‌های فعلی پروژه حذف یا بازنویسی نشدند. شناسه canonical در یک لایه مستقل ساخته شده است تا:

1. Study Tracker و Flagهای قبلی نشکنند.
2. Popupها بتوانند تدریجاً به شناسه استاندارد مهاجرت کنند.
3. رابطه‌های قدیمی همچنان قابل resolve باشند.
4. در مرحله ۶ بتوان Triage را با شناسه‌های استاندارد Disease و Medicine پیوند داد.

## نتیجه

لایه هویت مرکزی آماده است و مرحله بعد می‌تواند از آن برای اتصال قطعی سناریوهای Triage به بیماری‌ها و داروها استفاده کند. مرحله ۶ باید ابتدا رابطه‌های پیشنهادی فعلی را با aliasهای canonical دوباره بررسی کند و سپس فقط رابطه‌هایی را که معیار کافی دارند به `verified` تبدیل کند.
