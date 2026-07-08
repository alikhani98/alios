import {
  Check,
  Menu,
  Moon,
  MonitorSmartphone,
  Search,
  SunMedium,
  SunMoon,
  UserCircle,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  APPEARANCE_STORAGE_KEY,
  DISPLAY_NAME_STORAGE_KEY,
} from "@/shared/constants";
import { appConfig } from "@/shared/constants/app";
import { usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import {
  DEFAULT_APPEARANCE_PREFERENCE,
  getDisplayNameInitials,
  normalizeDisplayName,
  parseAppearancePreference,
} from "@/shared/preferences";
import { Badge, Button } from "@/shared/ui";
import { Input } from "@/shared/ui";

type ActivePanel = "theme" | "profile" | null;

const appearanceOptions = [
  { value: "light", icon: SunMedium, labelKey: "settings.light" },
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "system", icon: MonitorSmartphone, labelKey: "settings.system" },
] as const;

type TopbarProps = {
  title: string;
  onOpenMobileSidebar: () => void;
};

export function Topbar({ title, onOpenMobileSidebar }: TopbarProps) {
  const { direction, t } = useI18n();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { value: appearancePreference, setValue: setAppearancePreference } =
    usePersistentString({
      key: APPEARANCE_STORAGE_KEY,
      defaultValue: DEFAULT_APPEARANCE_PREFERENCE,
    });
  const { value: displayName, setValue: setDisplayName } = usePersistentString({
    key: DISPLAY_NAME_STORAGE_KEY,
    defaultValue: "",
  });
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const currentAppearance = parseAppearancePreference(appearancePreference);
  const hasDisplayName = displayName.trim().length > 0;
  const initials = getDisplayNameInitials(displayName);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setActivePanel(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
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

  const handleSelectAppearance = (value: string) => {
    setAppearancePreference(value);
    setActivePanel(null);
  };

  const handleOpenProfilePanel = () => {
    setDraftDisplayName(displayName);
    setActivePanel((currentValue) =>
      currentValue === "profile" ? null : "profile"
    );
  };

  const handleSaveDisplayName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayName(normalizeDisplayName(draftDisplayName));
    setActivePanel(null);
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b bg-background/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4 md:gap-3 md:px-6">
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
          <Badge variant="secondary" className="hidden md:inline-flex">
            {appConfig.version}
          </Badge>
        </div>
      </div>

      <div className="hidden w-full max-w-xs md:flex">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => navigate("/search")}
          aria-label={t("nav.search")}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("shell.searchPlaceholder")}</span>
        </Button>
      </div>

      <div
        ref={panelRef}
        className="relative flex items-center gap-1"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("settings.appearance")}
          title={t("settings.appearance")}
          onClick={() =>
            setActivePanel((currentValue) =>
              currentValue === "theme" ? null : "theme"
            )
          }
        >
          <SunMoon className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("settings.localProfile")}
          title={t("settings.localProfile")}
          onClick={handleOpenProfilePanel}
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
            className={`absolute top-full z-50 mt-2 w-64 rounded-2xl border bg-card p-2 shadow-aliosFloating ${
              direction === "rtl" ? "left-0" : "right-0"
            }`}
            role="menu"
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

        {activePanel === "profile" ? (
          <div
            className={`absolute top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border bg-card p-4 shadow-aliosFloating ${
              direction === "rtl" ? "left-0" : "right-0"
            }`}
            role="dialog"
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
                    setActivePanel(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>

            <Button
              asChild
              variant="ghost"
              className="mt-2 w-full justify-start"
            >
              <Link to="/settings">{t("nav.settings")}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
