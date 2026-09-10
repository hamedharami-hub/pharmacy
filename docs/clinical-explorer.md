# مرحله ۸: Clinical Explorer و جست‌وجوی مرکزی

Clinical Explorer اکنون از Command Palette برنامه در دسترس است و روی رجیستری canonical جست‌وجو می‌کند.

## Entityهای قابل جست‌وجو

- Disease
- Medicine
- Product
- Triage Scenario
- Clinical Concept
- CYP Enzyme
- Drug Mechanism

جست‌وجو عنوان فارسی و انگلیسی، شناسه، دسته‌بندی و metadata را بررسی می‌کند و نتایج را با امتیازدهی عنوان‌محور مرتب می‌سازد.

## ناوبری

انتخاب Disease، Product یا Medicine کاربر را به Shelf می‌برد. انتخاب Triage به ماژول Triage می‌رود و انتخاب Concept، CYP یا Mechanism به Knowledge منتقل می‌شود.

در Shelf، contextهای Disease و Product به‌ترتیب نمای Diseases و نمای Shelf را باز کرده و جست‌وجوی مرتبط را فعال می‌کنند.

## اعتبارسنجی

- ۱۰ فایل تست موفق
- ۳۷ تست موفق
- TypeScript و production build موفق
- جست‌وجوی دو‌زبانه و محدودیت نتایج تست شده است.
