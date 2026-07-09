export type HelpCenterLanguage = "fa" | "en";

export type LocalizedText = Readonly<{
  fa: string;
  en: string;
}>;

export type HelpCenterModule = Readonly<{
  id: string;
  title: LocalizedText;
  purpose: LocalizedText;
  whenToUse: LocalizedText;
  example: LocalizedText;
}>;

export type HelpCenterSection = Readonly<{
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  paragraphs?: readonly LocalizedText[];
  bullets?: readonly LocalizedText[];
  orderedBullets?: readonly LocalizedText[];
  modules?: readonly HelpCenterModule[];
}>;

function createText(fa: string, en: string): LocalizedText {
  return { fa, en } as const;
}

export function getLocalizedText(
  language: HelpCenterLanguage,
  text: LocalizedText
): string {
  return text[language];
}

export const settingsHelpCenterSections: readonly HelpCenterSection[] = [
  {
    id: "start-here",
    title: createText("از اینجا شروع کنید", "Start here"),
    summary: createText(
      "اگر تازه با AliOS آشنا شده‌اید، این چند قدم ساده بهترین شروع است.",
      "If you are new to AliOS, these simple steps are the best place to begin."
    ),
    paragraphs: [
      createText(
        "AliOS یک سیستم‌عامل شخصی محلی است که روی همین دستگاه کار می‌کند و به شما کمک می‌کند کارهای روزانه، پروژه‌ها، یادداشت‌ها و امور مالی را در یک جا نگه دارید.",
        "AliOS is a local-first personal operating system that runs on this device and helps you keep daily work, projects, notes, and finance in one place."
      ),
    ],
    orderedBullets: [
      createText("اول از بخش امروز برای کارهای همین روز استفاده کنید.", "Start with Today for the tasks and check-in of the current day."),
      createText("برای چیزهایی که هنوز مرتب نکرده‌اید از صندوق ورودی استفاده کنید.", "Use Inbox for quick capture when you do not want to organize something right away."),
      createText("کارهای بلندمدت را در پروژه‌ها نگه دارید.", "Keep longer commitments in Projects."),
      createText("برای مرور و فکرکردن از ژورنال استفاده کنید.", "Use Journal for reflection and notes about what happened."),
      createText("برای یادداشت‌های قابل‌استفاده دوباره از دانش استفاده کنید.", "Use Knowledge for reusable notes, rules, lessons, and checklists."),
      createText("برای درآمد، هزینه، قسط و بدهی از مالی استفاده کنید.", "Use Finance for income, expenses, installments, debts, and monthly awareness."),
      createText("خانه را به‌عنوان داشبورد اصلی خود ببینید.", "Use Home as your main dashboard."),
      createText("وقتی لازم بود زبان، ظاهر، پشتیبان یا راهنما را در تنظیمات تغییر دهید.", "Use Settings when you need language, appearance, backup, restore, or help."),
    ],
  },
  {
    id: "modules",
    title: createText("راهنمای بخش‌ها", "Module guide"),
    summary: createText(
      "هر بخش AliOS یک نقش ساده دارد. لازم نیست همه چیز را از روز اول کامل استفاده کنید.",
      "Each AliOS section has a simple role. You do not need to use everything perfectly from day one."
    ),
    paragraphs: [
      createText(
        "این راهنما کمک می‌کند بفهمید هر بخش چه کاری انجام می‌دهد، چه زمانی سراغش بروید و یک نمونه کاربردی آن چیست.",
        "This guide helps you see what each section is for, when to use it, and one practical example."
      ),
    ],
    modules: [
      {
        id: "home",
        title: createText("خانه", "Home"),
        purpose: createText("مرکز فرمان شماست و نمای کلی روز را نشان می‌دهد.", "It is your command center and shows the big picture of the day."),
        whenToUse: createText("وقتی می‌خواهید سریع وضعیت امروز را ببینید.", "When you want a quick glance at what matters today."),
        example: createText("باز کردن Home برای دیدن کارهای امروز، تقویم و بخش‌های قابل جمع‌شدن.", "Open Home to review today’s tasks, the calendar, and collapsible sections."),
      },
      {
        id: "today",
        title: createText("امروز", "Today"),
        purpose: createText("برای کارهای روزانه و ثبت چک‌این روزانه است.", "It is for daily tasks and the daily check-in."),
        whenToUse: createText("وقتی می‌خواهید روز فعلی را مدیریت کنید.", "When you want to manage the current day."),
        example: createText("سه کار اضافه کنید، یک MIT انتخاب کنید و چک‌این را ذخیره کنید.", "Add three tasks, choose a MIT, and save the check-in."),
      },
      {
        id: "projects",
        title: createText("پروژه‌ها", "Projects"),
        purpose: createText("برای هدف‌ها و تعهدهای بلندتر است که چند قدم دارند.", "It is for longer goals and commitments that take several steps."),
        whenToUse: createText("وقتی یک کار در یک روز تمام نمی‌شود.", "When a piece of work will not finish in one day."),
        example: createText("یک پروژه مثل «راه‌اندازی سایت شخصی».", "A project like “Launch my personal website.”"),
      },
      {
        id: "journal",
        title: createText("ژورنال", "Journal"),
        purpose: createText("برای نوشتن تجربه، احساس و چیزی است که یاد گرفته‌اید.", "It is for recording experiences, feelings, and what you learned."),
        whenToUse: createText("بعد از یک روز، رویداد یا تصمیم مهم.", "After a day, event, or important decision."),
        example: createText("چیزی که در یک جلسه گذشت و نتیجه‌ای که گرفتید را بنویسید.", "Write what happened in a meeting and the takeaway you want to keep."),
      },
      {
        id: "knowledge",
        title: createText("دانش", "Knowledge"),
        purpose: createText("برای یادداشت‌ها، قوانین، درس‌ها و چک‌لیست‌های قابل‌استفاده دوباره است.", "It is for reusable notes, rules, lessons, and checklists."),
        whenToUse: createText("وقتی چیزی را می‌خواهید بعداً هم دوباره پیدا کنید.", "When you want to find something again later."),
        example: createText("«مراحل آماده‌سازی برای مصاحبه» یا «قانون شخصی برای تصمیم‌گیری».", "“Interview prep steps” or a “personal decision rule.”"),
      },
      {
        id: "inbox",
        title: createText("اینباکس", "Inbox"),
        purpose: createText("برای ثبت سریع چیزهایی است که هنوز نمی‌دانید کجا باید بروند.", "It is for fast capture when you do not yet know where something belongs."),
        whenToUse: createText("وقتی می‌خواهید بدون فکر زیاد چیزی را نگه دارید.", "When you want to save something without sorting it yet."),
        example: createText("یک ایده، لینک یا یادآوری را سریع وارد کنید و بعداً پردازش کنید.", "Quickly capture an idea, link, or reminder and process it later."),
      },
      {
        id: "search",
        title: createText("جستجو", "Search"),
        purpose: createText("برای پیدا کردن محتوای ذخیره‌شده محلی در بخش‌های مختلف است.", "It is for finding saved local content across sections."),
        whenToUse: createText("وقتی بخشی از عنوان یا جزئیات را به یاد دارید.", "When you remember part of a title or detail."),
        example: createText("جستجوی «اجاره» برای پیدا کردن یک یادداشت مالی یا پروژه مرتبط.", "Search for “rent” to find a finance entry or related note."),
      },
      {
        id: "finance",
        title: createText("مالی", "Finance"),
        purpose: createText("برای ثبت درآمد، هزینه، قسط، بدهی و مرور ماهانه است.", "It is for recording income, expenses, installments, debts, and monthly review."),
        whenToUse: createText("وقتی می‌خواهید جریان پول یا فشار مالی را ببینید.", "When you want to understand money flow or financial pressure."),
        example: createText("ثبت حقوق، خریدهای روزمره و یک قسط تلفن.", "Add salary, grocery spending, and a phone installment."),
      },
      {
        id: "calendar",
        title: createText("تقویم", "Calendar"),
        purpose: createText("نمای ماهانه روی Home برای دیدن کارهای وابسته به تاریخ است.", "It is the monthly Home view for date-based tasks."),
        whenToUse: createText("وقتی می‌خواهید ببینید هر روز چه چیزی روی آن افتاده است.", "When you want to see what lands on each day."),
        example: createText("بررسی اینکه کدام کارها هفته آینده سررسید دارند.", "Check which tasks are due next week."),
      },
      {
        id: "routines",
        title: createText("روتین‌ها", "Routines"),
        purpose: createText("برای الگوهای آماده و محلی است که بعداً می‌توانید پیش‌نمایش یا استفاده کنید.", "It is for ready-made local templates you can preview and reuse later."),
        whenToUse: createText("وقتی می‌خواهید یک ترتیب تکراری و ساده داشته باشید.", "When you want a repeatable, simple sequence."),
        example: createText("پیش‌نمایش گرم‌کردن صبح یا مرور شبانه.", "Preview a morning warm-up or an evening review."),
      },
      {
        id: "wellness",
        title: createText("تندرستی", "Wellness"),
        purpose: createText("برای چک‌لیست آرام و محلی روتین بدمینتون است.", "It is for the calm local badminton routine checklist."),
        whenToUse: createText("وقتی می‌خواهید آماده‌سازی و بازتاب را منظم‌تر کنید.", "When you want a gentler preparation and reflection flow."),
        example: createText("گرم‌کردن، برداشتن آب، سردکردن و یک یادداشت کوتاه.", "Follow warm-up, take water, cool down, and write a short reflection."),
      },
      {
        id: "settings",
        title: createText("تنظیمات", "Settings"),
        purpose: createText("برای زبان، ظاهر، رنگ تأکیدی، پشتیبان، بازیابی و کمک است.", "It is for language, appearance, accent color, backup, restore, and help."),
        whenToUse: createText("وقتی می‌خواهید برنامه را تنظیم یا از داده‌ها محافظت کنید.", "When you want to adjust the app or protect your data."),
        example: createText("تغییر فارسی/انگلیسی، خروجی گرفتن از پشتیبان، یا بازنشانی چیدمان خانه.", "Switch Persian/English, export a backup, or reset the Home layout."),
      },
    ],
  },
  {
    id: "local-first",
    title: createText("داده‌های محلی و ایمنی", "Local-first and data safety"),
    summary: createText(
      "AliOS داده‌ها را فقط روی همین مرورگر و همین دستگاه نگه می‌دارد.",
      "AliOS stores data only in this browser on this device."
    ),
    bullets: [
      createText("هیچ بک‌اند، حساب کاربری یا همگام‌سازی ابری وجود ندارد.", "There is no backend, account, or cloud sync."),
      createText("اگر داده‌های مرورگر پاک شوند، اطلاعات محلی ممکن است از بین برود مگر اینکه پشتیبان داشته باشید.", "If browser storage is cleared, local data may be lost unless you have a backup."),
      createText("ترجیحات رابط مثل بخش‌های جمع‌شونده و رنگ تأکیدی هم محلی و مخصوص همین دستگاه هستند.", "UI preferences like collapsed sections and accent color are also local to this browser or device."),
      createText("بازیابی پشتیبان فقط داده‌های برنامه را طبق رفتار فعلی پوشش می‌دهد، نه هر ترجیح رابط را.", "Backup and restore cover app data as currently implemented, not every UI preference."),
    ],
  },
  {
    id: "backup",
    title: createText("پشتیبان و بازیابی", "Backup and restore"),
    summary: createText(
      "پشتیبان‌گیری دستی تنها راه امن برای جابه‌جایی یا نگه‌داری بیرون از مرورگر است.",
      "Manual backup is the only safe way to move or keep data outside the browser."
    ),
    bullets: [
      createText("پشتیبان را به‌صورت منظم خروجی بگیرید.", "Export a backup regularly."),
      createText("فایل پشتیبان را در جای امن و قابل اعتماد ذخیره کنید.", "Save the backup file somewhere safe."),
      createText("فقط فایل‌های پشتیبان معتبر AliOS را بازیابی کنید.", "Restore only trusted AliOS backup files."),
      createText("قبل از پاک‌کردن داده‌های مرورگر، تغییر دستگاه یا نصب دوباره مرورگر حتماً پشتیبان بگیرید.", "Back up before clearing browser data, changing devices, or reinstalling the browser."),
      createText("داده‌های مالی در قالب فعلی پشتیبان شامل می‌شوند.", "Finance data is included in the current backup format."),
      createText("ترجیحات فقط-محلی localStorage ممکن است در پشتیبان نباشند مگر اینکه از قبل برای آن‌ها پشتیبانی شده باشد.", "localStorage-only preferences may not be included unless they are already part of the backup behavior."),
    ],
  },
  {
    id: "home-finance",
    title: createText("خانه و مالی", "Home and Finance"),
    summary: createText(
      "جمع‌شدن بخش‌ها و مرور مالی هر دو برای سبک‌تر و روشن‌تر شدن تجربه شما هستند.",
      "Collapsed sections and Finance review both help make the experience lighter and clearer."
    ),
    bullets: [
      createText("بخش‌های خانه را می‌توانید جمع یا باز کنید تا داشبورد کوتاه‌تر شود.", "You can collapse or expand Home sections to make the dashboard shorter."),
      createText("وضعیت جمع/باز بعد از جابه‌جایی در برنامه و بعد از بارگذاری دوباره روی همین دستگاه باقی می‌ماند.", "Collapse state stays after navigation and reload on the same browser or device."),
      createText("جمع‌کردن بخش‌ها با نمایش/پنهان‌سازی و جابه‌جایی بخش‌ها فرق دارد.", "Collapse and expand is different from show/hide and reorder customization."),
      createText("بخش‌های مالی هم می‌توانند به‌صورت محلی جمع شوند.", "Finance sections can also be collapsed locally."),
      createText("مالی برای آگاهی و ثبت است، نه اتصال بانکی.", "Finance is for awareness and recording, not bank connection."),
      createText("پیش‌نمایش سررسید شمسی فقط برای نمایش است و ذخیره‌سازی همچنان ISO/Gregorian می‌ماند.", "The Jalali due-date preview is display-only; storage stays ISO/Gregorian."),
    ],
  },
  {
    id: "first-week",
    title: createText("هفته اول خوب با AliOS", "A good first week with AliOS"),
    summary: createText(
      "این چک‌لیست فقط راهنماست و هیچ مدل داده تازه‌ای ایجاد نمی‌کند.",
      "This checklist is guidance only and does not create any new data model."
    ),
    orderedBullets: [
      createText("۳ کار در Today اضافه کنید.", "Add 3 tasks in Today."),
      createText("۳ فکر یا یادداشت سریع در Inbox ثبت کنید.", "Capture 3 quick thoughts in Inbox."),
      createText("۱ پروژه فعال بسازید.", "Create 1 active project."),
      createText("۱ یادداشت در Journal بنویسید.", "Write 1 journal entry."),
      createText("۱ مورد Knowledge اضافه کنید.", "Add 1 knowledge item."),
      createText("چند تراکنش در Finance ثبت کنید.", "Record a few Finance transactions."),
      createText("یک پشتیبان خروجی بگیرید.", "Export a backup."),
    ],
  },
];

