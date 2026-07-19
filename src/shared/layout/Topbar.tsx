import {
  Check,
  LayoutDashboard,
  Menu,
  Moon,
  MonitorSmartphone,
  Search,
  SunMedium,
  SunMoon,
  UserCircle,
} from "lucide-react";
import {
  Suspense,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  APPEARANCE_STORAGE_KEY,
  DISPLAY_NAME_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { appConfig } from "@/shared/constants/app";
import { usePersistentString } from "@/shared/hooks/usePersistentString";
import { useI18n } from "@/shared/i18n";
import { lazyWithRetry } from "@/shared/runtime/lazyWithRetry";
import {
  getAccentColorThemeVariables,
  useAccentColorPreference,
} from "@/shared/preferences/accentColor";
import {
  DEFAULT_APPEARANCE_PREFERENCE,
  parseAppearancePreference,
} from "@/shared/preferences/appearance";
import {
  getDisplayNameInitials,
  normalizeDisplayName,
} from "@/shared/preferences/profile";
import { Badge, Button, SectionHeader } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { aliosPopoverMotion, aliosSurfaceMotion } from "@/shared/ui/motion";
import { cn } from "@/shared/utils/cn";

import { useHomeDashboardLayout } from "@/features/home/hooks/useHomeDashboardLayout";

type ActivePanel = "dashboard" | "theme" | "profile" | null;

const HomeDashboardCustomizer = lazyWithRetry(() =>
  import("@/features/home/components/HomeDashboardCustomizer").then((module) => ({
    default: module.HomeDashboardCustomizer,
  }))
);

const appearanceOptions = [
  { value: "light", icon: SunMedium, labelKey: "settings.light" },
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "system", icon: MonitorSmartphone, labelKey: "settings.system" },
] as const;

type TopbarProps = {
  title: string;
  onOpenMobileSidebar: () => void;
  showDashboardControls?: boolean;
};

const accentColorOptions = [
  { value: "default", labelKey: "settings.accentDefault" },
  { value: "violet", labelKey: "settings.accentViolet" },
  { value: "rose", labelKey: "settings.accentRose" },
  { value: "amber", labelKey: "settings.accentAmber" },
  { value: "emerald", labelKey: "settings.accentEmerald" },
  { value: "slate", labelKey: "settings.accentSlate" },
] as const;

export function Topbar({
  title,
  onOpenMobileSidebar,
  showDashboardControls = false,
}: TopbarProps) {
  const { direction, t } = useI18n();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const activePanelContentRef = useRef<HTMLDivElement>(null);
  const activePanelTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { value: appearancePreference, setValue: setAppearancePreference } =
    usePersistentString({
      key: APPEARANCE_STORAGE_KEY,
      defaultValue: DEFAULT_APPEARANCE_PREFERENCE,
    });
  const { value: displayName, setValue: setDisplayName } = usePersistentString({
    key: DISPLAY_NAME_STORAGE_KEY,
    defaultValue: "",
  });
  const { value: accentColorPreference, setValue: setAccentColorPreference } =
    useAccentColorPreference();
  const {
    layout,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    resetLayout,
  } = useHomeDashboardLayout();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const savedMessageTimer = useRef<number | null>(null);
  const currentAppearance = parseAppearancePreference(appearancePreference);
  const hasDisplayName = displayName.trim().length > 0;
  const initials = getDisplayNameInitials(displayName);

  useEffect(() => {
    if (!showDashboardControls && activePanel === "dashboard") {
      setActivePanel(null);
    }
  }, [activePanel, showDashboardControls]);

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      activePanelContentRef.current
        ?.querySelector<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"
        )
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activePanel]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        closeActivePanel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeActivePanel(true);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (savedMessageTimer.current !== null) {
        window.clearTimeout(savedMessageTimer.current);
      }
    };
  }, []);

  const closeActivePanel = (restoreFocus = false) => {
    setActivePanel(null);

    if (restoreFocus) {
      window.requestAnimationFrame(() => activePanelTriggerRef.current?.focus());
    }
  };

  const togglePanel = (panel: Exclude<ActivePanel, null>, trigger: HTMLButtonElement) => {
    setActivePanel((currentValue) => {
      if (currentValue === panel) {
        return null;
      }

      activePanelTriggerRef.current = trigger;
      return panel;
    });
  };

  const handleSelectAppearance = (value: string) => {
    setAppearancePreference(value);
    closeActivePanel(true);
  };

  const showSavedFeedback = () => {
    setSavedMessage(t("common.changesSaved"));

    if (savedMessageTimer.current !== null) {
      window.clearTimeout(savedMessageTimer.current);
    }

    savedMessageTimer.current = window.setTimeout(() => {
      setSavedMessage(null);
      savedMessageTimer.current = null;
    }, 1800);
  };

  const handleMoveSectionUp = (sectionId: Parameters<typeof moveSectionUp>[0]) => {
    moveSectionUp(sectionId);
    showSavedFeedback();
  };

  const handleMoveSectionDown = (
    sectionId: Parameters<typeof moveSectionDown>[0]
  ) => {
    moveSectionDown(sectionId);
    showSavedFeedback();
  };

  const handleToggleSectionVisibility = (
    sectionId: Parameters<typeof toggleSectionVisibility>[0]
  ) => {
    toggleSectionVisibility(sectionId);
    showSavedFeedback();
  };

  const handleResetLayout = () => {
    resetLayout();
    showSavedFeedback();
  };

  const handleSelectAccentColor = (
    value: (typeof accentColorOptions)[number]["value"]
  ) => {
    setAccentColorPreference(value);
    showSavedFeedback();
  };

  const handleOpenProfilePanel = (trigger: HTMLButtonElement) => {
    setDraftDisplayName(displayName);
    togglePanel("profile", trigger);
  };

  const handleSaveDisplayName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayName(normalizeDisplayName(draftDisplayName));
    closeActivePanel(true);
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[var(--alios-topbar-height)] items-center gap-2 border-b border-border/70 bg-background/80 px-3 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:px-4 md:gap-3 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileSidebar}
        aria-label={t("shell.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
            {title}
          </h1>
          <Badge variant="secondary" className="hidden rounded-full md:inline-flex">
            {appConfig.version}
          </Badge>
        </div>
      </div>

      <div className="hidden w-full max-w-xs md:flex">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-start gap-2 rounded-2xl border-border/70 bg-card/80 text-muted-foreground shadow-sm"
          onClick={() => navigate("/search")}
          aria-label={t("nav.search")}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("shell.searchPlaceholder")}</span>
        </Button>
      </div>

      <div
        ref={panelRef}
        className={cn(
          "relative flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-sm",
          aliosSurfaceMotion
        )}
      >
        {showDashboardControls ? (
          <div className="group relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t("home.dashboardLayoutTooltip")}
              aria-expanded={activePanel === "dashboard"}
              aria-controls="topbar-dashboard-controls"
              aria-haspopup="dialog"
              title={t("home.dashboardLayoutTooltip")}
              onClick={(event) => togglePanel("dashboard", event.currentTarget)}
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>

            <span
              role="tooltip"
              className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-popover px-3 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {t("home.dashboardLayoutTooltip")}
            </span>
          </div>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("settings.appearance")}
          aria-expanded={activePanel === "theme"}
          aria-controls="topbar-theme-controls"
          aria-haspopup="dialog"
          title={t("settings.appearance")}
          onClick={(event) => togglePanel("theme", event.currentTarget)}
        >
          <SunMoon className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("settings.localProfile")}
          aria-expanded={activePanel === "profile"}
          aria-controls="topbar-profile-controls"
          aria-haspopup="dialog"
          title={t("settings.localProfile")}
          onClick={(event) => handleOpenProfilePanel(event.currentTarget)}
        >
          {hasDisplayName ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
              {initials}
            </span>
          ) : (
            <UserCircle className="h-5 w-5" />
          )}
        </Button>

        {activePanel === "theme" ? (
          <div
            ref={activePanelContentRef}
            id="topbar-theme-controls"
            className={cn(
              "absolute top-full z-50 mt-2 max-h-[calc(100vh-6rem)] w-64 overflow-y-auto rounded-2xl border bg-card p-2 shadow-aliosFloating",
              aliosPopoverMotion,
              direction === "rtl" ? "left-0" : "right-0"
            )}
            role="dialog"
            aria-modal="false"
            aria-label={t("settings.appearance")}
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold">{t("settings.appearance")}</p>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("settings.appearanceDescription")}
              </p>
            </div>
            <div className="space-y-1">
              {appearanceOptions.map(({ value, icon: Icon, labelKey }) => (
                <Button
                  key={value}
                  type="button"
                  variant={
                    currentAppearance === value ? "secondary" : "ghost"
                  }
                  className="w-full justify-start gap-2"
                  aria-pressed={currentAppearance === value}
                  onClick={() => handleSelectAppearance(value)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-start">{t(labelKey)}</span>
                  {currentAppearance === value ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : null}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {activePanel === "dashboard" ? (
          <div
            ref={activePanelContentRef}
            id="topbar-dashboard-controls"
            className={cn(
              "absolute top-full z-50 mt-2 max-h-[calc(100vh-7rem)] w-[min(30rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border bg-card p-3 shadow-aliosFloating",
              aliosPopoverMotion,
              direction === "rtl" ? "left-0" : "right-0"
            )}
            role="dialog"
            aria-modal="false"
            aria-label={t("home.dashboardControlsTitle")}
          >
            <Suspense
              fallback={
                <div className="space-y-4">
                  <SectionHeader
                    icon={<LayoutDashboard className="h-5 w-5" />}
                    title={t("home.dashboardControlsTitle")}
                    description={t("home.dashboardControlsDescription")}
                    status={
                      <Badge variant="secondary" className="shrink-0">
                        {t("common.loading")}
                      </Badge>
                    }
                  />
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                <SectionHeader
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  title={t("home.dashboardControlsTitle")}
                  description={t("home.dashboardControlsDescription")}
                  status={
                    <Badge variant="secondary" className="shrink-0">
                      {t("home.localOnlyDashboardPreference")}
                    </Badge>
                  }
                />

                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <HomeDashboardCustomizer
                    layout={layout}
                    onMoveUp={handleMoveSectionUp}
                    onMoveDown={handleMoveSectionDown}
                    onToggleVisibility={handleToggleSectionVisibility}
                    onReset={handleResetLayout}
                  />
                </div>
              </div>
            </Suspense>
          </div>
        ) : null}

        {activePanel === "profile" ? (
          <div
            ref={activePanelContentRef}
            id="topbar-profile-controls"
            className={cn(
              "absolute top-full z-50 mt-2 max-h-[calc(100vh-6rem)] w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border bg-card p-4 shadow-aliosFloating",
              aliosPopoverMotion,
              direction === "rtl" ? "left-0" : "right-0"
            )}
            role="dialog"
            aria-modal="false"
            aria-label={t("settings.localProfile")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {hasDisplayName ? initials : <UserCircle className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("settings.editProfile")}
                </p>
                <p className="truncate text-sm font-semibold">
                  {hasDisplayName ? displayName : t("settings.localProfile")}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("settings.localOnlyProfile")}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("settings.noOnlineAccount")}
                </p>
              </div>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSaveDisplayName}>
              <label className="block space-y-1">
                <span className="text-sm font-medium">
                  {t("settings.displayName")}
                </span>
                <Input
                  value={draftDisplayName}
                  onChange={(event) => setDraftDisplayName(event.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                  aria-label={t("settings.displayName")}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="flex-1">
                  {t("common.saveChanges")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDraftDisplayName(displayName);
                    closeActivePanel(true);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>

            <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">
                    {t("settings.accentColor")}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("settings.accentColorDescription")}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {t("settings.appearance")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {accentColorOptions.map(({ value, labelKey }) => {
                  const palette = getAccentColorThemeVariables(
                    value,
                    currentAppearance === "dark"
                  );
                  const isSelected = accentColorPreference === value;

                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      className="h-auto justify-start gap-3 rounded-2xl px-3 py-3 text-start"
                      onClick={() => handleSelectAccentColor(value)}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: `hsl(${palette.primary})` }}
                      >
                        {isSelected ? (
                          <Check
                            className={`h-4 w-4 ${
                              value === "amber" ? "text-slate-900" : "text-white"
                            }`}
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {t(labelKey)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {isSelected
                            ? t("home.currentAccentColor")
                            : t("home.selectAccentColor")}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              className="mt-2 w-full justify-start"
            >
              <Link to="/settings">{t("nav.settings")}</Link>
            </Button>
          </div>
        ) : null}

        {savedMessage ? (
          <div
            className="absolute top-full mt-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary shadow-sm"
            role="status"
            aria-live="polite"
          >
            {savedMessage}
          </div>
        ) : null}
      </div>
    </header>
  );
}
