# PROJECT_CONTEXT.md — AliOS

## معماری و تکنولوژی
- Local-first Persian/English personal life-management PWA
- Stack: React, TypeScript, Vite, Tailwind CSS, Dexie/IndexedDB, pnpm
- Sync اختیاری با Supabase (local-only بدون حساب هم کاملاً کار می‌کند)
- Repo: github.com/alikhani98/alios — Live: alikhani98.github.io/alios
- Coding agent: Codex (پرامپت‌ها به انگلیسی برای دقت فنی؛ گفتگو با Claude به فارسی)

## ساختار پروژه (بخش‌های اصلی)
خانه (Home)، صندوق ورودی (Inbox)، امروز (Today)، تقویم (Calendar)، روتین‌ها (Routines)،
مرور هفته (Weekly Review)، تصمیم‌ها (Decisions)، اهداف (Goals)، پروژه‌ها (Projects),
حوزه‌های زندگی (Life Areas)، دانش (Knowledge)، دفترچه شخصی (Personal Manual)،
مالی (Finance)، جستجو (Search)، تنظیمات (Settings)

## سیستم طراحی (تأیید شده)
- رنگ‌ها: Caspian Ink #172033 (متن/دکمه اصلی)، Pomegranate Signal #B23A48 (فقط هشدار/توجه — هرگز برای اکشن روتین)،
  Saffron Thread #E7A928 (پیشرفت/تداوم — موتیف "نخ روز")، Herb Glass #5F8D6A (موفقیت)،
  Morning Paper #F6F1E8 (سطح روشن — فقط روی یک سطح "الان" هر صفحه، هرگز کل صفحه)،
  Night Garden #101820 (دارک مود)
- تایپوگرافی: Vazirmatn (فارسی/انگلیسی)، فونت mono برای اعداد مالی/تاریخ/شمارنده
- الگو: "personal operating desk" — یک سطح "الان" واضح + قفسه‌های زمینه‌ی آرام‌تر
- موتیف تکرارشونده: "نخ روز" — خط Saffron که Today→Inbox→Weekly Review را وصل می‌کند
- این سیستم روی همه‌ی صفحات و primitiveهای مشترک (button, badge, StatusChip, charts, Sidebar, Topbar) پیاده شده

## قوانین کدنویسی/معماری ثابت
- هیچ scope creep — فیچرها فقط بعد از تصمیم صریح اضافه می‌شوند
- تغییرات UI/CSS-only باید از تغییرات منطق/schema جدا اعلام شوند
- افزودن فیلد جدید به دیتامدل فقط additive/optional — هرگز breaking change
- الگوی Disclosure: استفاده از `CollapsibleSection` مشترک؛ تو در تو شدن باید rail-based (RTL-aware border-inline-start) باشد، نه indentation تجمعی
- RTL: هرگز `break-all` بدون شرط روی متن کاربر-محور؛ همیشه `break-words` + `min-w-0` در ردیف‌های عنوان+badge
- کتابخانه‌ی سنگین جدید فقط با تأیید صریح؛ همیشه اول بررسی شود آیا امکان موجود کافی است
- هر تغییر باید با `pnpm build` و `pnpm test:run` قبل از commit تأیید شود

## وضعیت فعلی (Aug 2026)
- باجت پرفورمنس: entry chunk از ۴۳۸KB به ۹۹.۵KB کاهش یافت؛ Settings از ۱۳۵.۵۷KB به ۵۴.۱۹KB
- Triage تراکم UI کامل شده (۸ صفحه: Settings, Weekly Review, Finance, Goals, Manual, Today, Inbox, Home, Decisions)
- Mobile usability audit کامل (touch targets, keyboard, gestures, safe-area) — انجام شده
- Bottom Navigation موبایل، Swipe actions در Inbox/Today — پیاده‌سازی شده
- تقریباً تمام پیشنهادهای دو بررسی کارشناسی خارجی پیاده‌سازی شده: empty states, smart next-action, batch processing, streaks, auto goal progress, search filters, scheduled dark mode, time blocking, focus mode, milestones, key results, backlinks, natural-language dates, snooze, auto-categorization, daily briefing, Kanban برای Projects، CSV import برای Finance، voice input
- عمداً کنار گذاشته نشده چیز مهمی؛ موارد بسیار جزئی (avatar upload، رنگ‌های بیشتر پروفایل) هنوز بررسی نشده

## چیزهایی که نباید بدون دلیل قوی تغییر کنند
- معماری local-first / Dexie repositories
- الگوی auth-session hub (شکننده بوده، قبلاً یک crash بزرگ از همینجا آمده)
- ساختار i18n لیزی per-locale (بخشی از فیکس باجت پرفورمنس بود)
- الگوی manual chunking در vite.config

## نکات محیط توسعه
- ویندوز: مشکل EPERM گاهی برمی‌گردد؛ راه‌حل: حذف `node_modules` و `pnpm install --frozen-lockfile` بدون Admin
- مسیر پروژه باید خارج از OneDrive/Windows Desktop sync باشد (`C:\dev\alios-app-stage-2`)