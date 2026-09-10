# مرحله ۷: اتصال CYP، مکانیسم‌ها و Clinical Concepts

## هدف

موجودیت‌های CYP، مکانیسم‌های دارویی و Clinical Concepts که پیش‌تر در رجیستری مرکزی ثبت شده بودند، اکنون روابط canonical و مسیرهای ناوبری‌پذیر دارند.

## روابط اضافه‌شده

```text
CYP Enzyme → interacts-with → Medicine
Medicine → explains → Mechanism
Clinical Concept → explains → CYP Enzyme
Clinical Concept → explains → Medicine
```

اتصال‌هایی که از متن یا alias به‌دست آمده‌اند `suggested` هستند. تنها اتصال‌هایی که از داده صریح محصول یا کد مکانیسم می‌آیند می‌توانند `verified` باقی بمانند.

## CYP

ورودی‌های inhibitors، inducers و substrates در پروفایل‌های CYP با aliasهای Medicine مقایسه می‌شوند. Pair interactionهای رایج نیز وارد همین لایه می‌شوند تا CYP3A4، CYP2D6 و سایر آنزیم‌ها مسیر قابل resolve به Medicine داشته باشند.

## مکانیسم دارویی

مکانیسم‌ها با متن رجیستری، نام ژنریک، نام برند و توضیحات بالینی به Medicine وصل می‌شوند. این اتصال در Popup مکانیسم نمایش داده می‌شود و روابط مرتبط را قابل مشاهده می‌کند.

## Clinical Concepts

Conceptهایی که در عنوان یا توضیح خود به CYP یا یک Medicine اشاره می‌کنند، به‌عنوان روابط آموزشی پیشنهادی ثبت می‌شوند. این روابط برای مطالعه و ناوبری مفید هستند، اما بدون بررسی داروساز به‌عنوان حقیقت بالینی قطعی علامت‌گذاری نمی‌شوند.

## رابط کاربری

پنل Clinical Connections به این بخش‌ها اضافه شد:

- پنل CYP برای آنزیم فعال
- Popup مکانیسم دارویی
- مسیرهای موجود رجیستری مرکزی برای Conceptها و Medicineها

## اعتبارسنجی

- ۹ فایل تست موفق
- ۳۳ تست موفق
- تمام endpointهای روابط در رجیستری مرکزی قابل resolve هستند.
- روابط متنی به‌صورت خودکار verified نمی‌شوند.
- TypeScript و production build موفق هستند.

مرحله بعدی می‌تواند روی Explorer مرکزی و جست‌وجوی یکپارچه Disease، Medicine، Product، Triage و Knowledge تمرکز کند.
