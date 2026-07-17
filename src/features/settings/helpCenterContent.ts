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
      createText("حوزه‌های زندگی را مرور کنید و هدف‌های مهم خود را در بخش هدف‌ها نگه دارید.", "Review Life Areas and keep meaningful outcomes in Goals."),
      createText("کارهای بلندمدت را در پروژه‌ها نگه دارید و کارهای روزانه را در صورت نیاز به آن‌ها متصل کنید.", "Keep longer commitments in Projects and optionally link daily tasks to them."),
      createText("برای مرور و فکرکردن از ژورنال استفاده کنید.", "Use Journal for reflection and notes about what happened."),
      createText("برای یادداشت‌های قابل‌استفاده دوباره از دانش استفاده کنید.", "Use Knowledge for reusable notes, rules, lessons, and checklists."),
      createText("تصمیم‌های مهم و قواعد شخصی را در ثبت تصمیم‌ها و دفترچه شخصی نگه دارید.", "Keep important decisions and personal rules in Decisions and Personal Manual."),
      createText("برای جمع‌بندی داده‌های موجود، مرور هفتگی را باز کنید.", "Open Weekly Review to summarize your existing local records."),
      createText("برای درآمد، هزینه، قسط و بدهی از مالی استفاده کنید.", "Use Finance for income, expenses, installments, debts, and monthly awareness."),
      createText("خانه را به‌عنوان داشبورد اصلی خود ببینید.", "Use Home as your main dashboard."),
      createText("وقتی لازم بود زبان، ظاهر، پشتیبان، خروجی، بازیابی یا راهنما را تغییر دهید به تنظیمات بروید.", "Use Settings when you need language, appearance, backup, exports, recovery, or help."),
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
        example: createText("سه کار اضافه کنید، یک MIT انتخاب کنید و در صورت نیاز یک کار را به پروژه‌اش متصل کنید.", "Add three tasks, choose a MIT, and optionally link a task to its Project."),
      },
      {
        id: "projects",
        title: createText("پروژه‌ها", "Projects"),
        purpose: createText("برای هدف‌ها و تعهدهای بلندتر است که چند قدم دارند.", "It is for longer goals and commitments that take several steps."),
        whenToUse: createText("وقتی یک کار در یک روز تمام نمی‌شود.", "When a piece of work will not finish in one day."),
        example: createText("پروژه «راه‌اندازی سایت شخصی» را بسازید و در صورت نیاز آن را به یک هدف متصل کنید.", "Create “Launch my personal website” and optionally link it to a Goal."),
      },
      {
        id: "goals",
        title: createText("هدف‌ها", "Goals"),
        purpose: createText("برای هدف‌های دستی، محلی و زمان‌دار است که می‌خواهید آن‌ها را مرور کنید.", "It is for manually managed, local, time-bound goals that you want to review."),
        whenToUse: createText("وقتی می‌خواهید پیشرفت، مرور و وضعیت یک هدف را ثبت کنید.", "When you want to record the progress, review, and status of a goal."),
        example: createText("هدف «بهبود خواب در سه ماه آینده» را در حوزه سلامت ثبت کنید.", "Add “Improve sleep over the next three months” under Health."),
      },
      {
        id: "life-areas",
        title: createText("حوزه‌های زندگی", "Life Areas"),
        purpose: createText("برای نگه‌داشتن نمایی آرام از بخش‌های اصلی زندگی، میزان توجه، رضایت و زمان مرور آن‌هاست.", "It keeps a calm view of the main parts of life, their attention, satisfaction, and review timing."),
        whenToUse: createText("وقتی می‌خواهید ببینید کدام بخش زندگی به توجه یا مرور نیاز دارد.", "When you want to see which part of life needs attention or review."),
        example: createText("رضایت حوزه سلامت را ثبت کنید و هدف‌های مرتبط همان حوزه را ببینید.", "Record Health satisfaction and view the Goals connected to that area."),
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
        id: "manual",
        title: createText("دفترچه شخصی", "Personal Manual"),
        purpose: createText("برای اصول، ارزش‌ها، قواعد، ترجیحات، مرزها، روتین‌ها و درس‌های شخصی شماست.", "It is for your principles, values, rules, preferences, boundaries, routines, and lessons."),
        whenToUse: createText("وقتی می‌خواهید یک مرجع شخصی قابل جستجو و مرور بسازید.", "When you want a searchable, reviewable personal reference."),
        example: createText("قاعده‌ای برای تصمیم‌گیری در روزهای کم‌انرژی ثبت کنید.", "Record a decision rule for low-energy days."),
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
        id: "weekly-review",
        title: createText("مرور هفتگی", "Weekly Review"),
        purpose: createText("خلاصه‌ای خواندنی و محلی از هفت روز اخیر و موارد نیازمند مرور می‌سازد.", "It builds a readable local summary of the last seven days and items due for review."),
        whenToUse: createText("هفته‌ای یک بار یا وقتی می‌خواهید وضعیت کلی را جمع‌بندی کنید.", "Once a week or whenever you want to summarize the bigger picture."),
        example: createText("کارهای انجام‌شده، صندوق ورودی، هدف‌ها، حوزه‌ها و موارد نیازمند مرور را بررسی کنید.", "Review completed tasks, Inbox, Goals, Life Areas, and items due for review."),
      },
      {
        id: "decisions",
        title: createText("ثبت تصمیم‌ها", "Decisions"),
        purpose: createText("برای ثبت تصمیم، دلیل، نتیجه مورد انتظار، زمان مرور و نتیجه واقعی است.", "It records a decision, rationale, expected outcome, review timing, and actual result."),
        whenToUse: createText("وقتی تصمیمی مهم‌تر از یک یادداشت معمولی دارید.", "When a choice matters more than an ordinary note."),
        example: createText("یک تصمیم کاری را ثبت کنید و برای ماه آینده زمان مرور بگذارید.", "Record a work decision and schedule a review for next month."),
      },
      {
        id: "finance",
        title: createText("مالی", "Finance"),
        purpose: createText("برای ثبت درآمد، هزینه، قسط، بدهی و مرور توصیفی ماهانه است.", "It records income, expenses, installments, debts, and descriptive monthly review."),
        whenToUse: createText("وقتی می‌خواهید جریان پول یا فشار مالی را ببینید.", "When you want to understand money flow or financial pressure."),
        example: createText("حقوق، خریدهای روزمره و یک قسط را ثبت کنید و برنامه ماهانه مشتق‌شده را ببینید.", "Add salary, daily spending, and an installment, then inspect the derived monthly plan."),
      },
      {
        id: "export-center",
        title: createText("مرکز خروجی", "Export Center"),
        purpose: createText("فایل‌های خواندنی CSV یا Markdown از بخش‌های پشتیبانی‌شده می‌سازد و از پشتیبان کامل جداست.", "It creates readable CSV or Markdown files for supported modules and stays separate from full backup."),
        whenToUse: createText("وقتی می‌خواهید داده‌های یک بخش را بخوانید، چاپ کنید یا خارج از AliOS نگه دارید.", "When you want to read, print, or keep one module outside AliOS."),
        example: createText("گزارش مالی CSV یا خروجی Markdown دفترچه شخصی و حوزه‌های زندگی بگیرید.", "Export Finance CSV or Personal Manual and Life Areas Markdown."),
      },
      {
        id: "recovery",
        title: createText("حالت بازیابی و گزارش خطا", "Recovery Mode and local error log"),
        purpose: createText("مسیر محلی و غیرمخربی برای دسترسی آرام به تنظیمات، پشتیبان، خروجی و خطاهای اخیر است.", "It is a local, non-destructive path to Settings, backup, exports, and recent error summaries."),
        whenToUse: createText("وقتی یک صفحه درست باز نمی‌شود یا می‌خواهید خطاهای محلی اخیر را بررسی کنید.", "When a page does not open correctly or you want to inspect recent local errors."),
        example: createText("حالت بازیابی را فعال کنید، یک پشتیبان بگیرید و سپس گزارش خطای محلی را بررسی یا پاک کنید.", "Enable Recovery Mode, create a backup, then inspect or clear the local error log."),
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
        purpose: createText("برای زبان، ظاهر، رنگ تأکیدی، پشتیبان، خروجی‌های خواندنی، بازیابی، گزارش خطا و راهنماست.", "It is for language, appearance, accent color, backup, readable exports, recovery, error logs, and help."),
        whenToUse: createText("وقتی می‌خواهید برنامه را تنظیم یا از داده‌ها محافظت کنید.", "When you want to adjust the app or protect your data."),
        example: createText("زبان را تغییر دهید، پشتیبان یا خروجی خواندنی بگیرید، یا حالت بازیابی را بررسی کنید.", "Switch language, create a backup or readable export, or inspect Recovery Mode."),
      },
    ],
  },
  {
    id: "planning-links",
    title: createText("ارتباط حوزه، هدف، پروژه و کار", "Life Area, Goal, Project, and Task links"),
    summary: createText(
      "ارتباط‌ها در AliOS ساده و یک‌طرفه‌اند؛ پیوندهای پروژه و کار اختیاری‌اند تا هر رکورد مستقل و قابل استفاده بماند.",
      "AliOS links are simple and one-way; Project and Task links are optional so every record remains independent and usable."
    ),
    bullets: [
      createText("هر هدف یک حوزه زندگی دارد و خلاصه هدف‌های هر حوزه از داده‌های موجود محاسبه می‌شود.", "Each Goal records one Life Area, and each area summary is derived from existing Goals."),
      createText("پروژه می‌تواند به یک هدف متصل شود؛ هدف فهرست معکوس پروژه‌ها را ذخیره نمی‌کند.", "A Project can link to one Goal; the Goal does not store a reverse Project list."),
      createText("کار امروز می‌تواند به یک پروژه متصل شود؛ پروژه فهرست معکوس کارها را ذخیره نمی‌کند.", "A Today Task can link to one Project; the Project does not store a reverse Task list."),
      createText("حذف هدف یا پروژه باعث حذف خودکار رکورد متصل نمی‌شود؛ وضعیت «در دسترس نیست» نشان داده می‌شود تا بتوانید پیوند را حذف یا تغییر دهید.", "Deleting a Goal or Project does not delete the linked record; an unavailable state lets you remove or change the link."),
      createText("این ارتباط‌ها محلی هستند و در پشتیبان معتبر AliOS حفظ می‌شوند.", "These links stay local and are preserved in a valid AliOS backup."),
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
      createText("کارها، پروژه‌ها، هدف‌ها، حوزه‌های زندگی، تصمیم‌ها، دفترچه شخصی و داده‌های مالی در قالب فعلی پشتیبان پوشش داده می‌شوند.", "Tasks, Projects, Goals, Life Areas, Decisions, Personal Manual, and Finance records are covered by the current backup format."),
      createText("یادآوری پشتیبان فقط زمان آخرین خروجی موفق را روی همین مرورگر نگه می‌دارد؛ خودش فایل پشتیبان یا پشتیبان خودکار نمی‌سازد.", "The backup reminder stores only the last successful export time in this browser; it does not create a backup file or automatic backup."),
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
      createText("حوزه‌های زندگی را مرور کنید و ۱ هدف کاربردی بسازید.", "Review Life Areas and create 1 practical Goal."),
      createText("۱ پروژه فعال بسازید و در صورت نیاز آن را به هدف متصل کنید؛ سپس یک کار امروز را به پروژه پیوند دهید.", "Create 1 active Project, optionally link it to the Goal, then link one Today Task to the Project."),
      createText("۱ یادداشت در Journal و ۱ مورد در Knowledge اضافه کنید.", "Add 1 Journal note and 1 Knowledge item."),
      createText("۱ تصمیم مهم و ۱ قاعده در دفترچه شخصی ثبت کنید.", "Record 1 important Decision and 1 Personal Manual rule."),
      createText("چند تراکنش در Finance ثبت کنید.", "Record a few Finance transactions."),
      createText("مرور هفتگی را باز کنید و موارد نیازمند مرور را ببینید.", "Open Weekly Review and inspect items due for review."),
      createText("یک پشتیبان خروجی بگیرید.", "Export a backup."),
    ],
  },
];
