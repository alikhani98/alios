import { Check, Clock3, Moon, MonitorSmartphone, SunMedium } from "lucide-react";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import { accentColorPreferences, getAccentColorThemeVariables, useAccentColorPreference } from "@/shared/preferences/accentColor";
import { useViewDensityMode } from "@/shared/preferences/viewDensityMode";
import type { AppearancePreference } from "@/shared/preferences/appearance";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";

const themeOptions = [
  { value: "light", icon: SunMedium, labelKey: "settings.light" },
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "system", icon: MonitorSmartphone, labelKey: "settings.system" },
  { value: "scheduled", icon: Clock3, labelKey: "settings.scheduled" },
] as const;

export function ThemePreviewPicker({ value, onChange }: { value: AppearancePreference; onChange: (value: AppearancePreference) => void }) {
  const { t } = useI18n();
  const { isSimpleView } = useViewDensityMode();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label={t("settings.appearance")}>
      {themeOptions.map(({ value: theme, icon: Icon, labelKey }) => (
        <Button key={theme} type="button" variant="outline" aria-pressed={value === theme} onClick={() => onChange(theme)} className={`h-auto min-w-0 flex-col gap-3 p-3 ${value === theme ? "border-primary bg-accent ring-1 ring-primary" : ""}`}>
          {!isSimpleView ? <span data-theme-preview aria-hidden="true" className="relative flex h-24 w-full overflow-hidden rounded-lg border border-border" dir="ltr">
            {(theme === "system" || theme === "scheduled" ? [false, true] : [theme === "dark"]).map((dark, index) => (
              <span key={index} className={`flex min-w-0 flex-1 gap-2 p-2 ${dark ? "bg-alios-caspian text-alios-paper" : "bg-alios-paper text-alios-caspian"}`}>
                <span className="w-1/4 space-y-2 border-e border-border/60 pe-1.5 pt-1">
                  <span className="block h-2 w-2 rounded-full bg-primary" />
                  <span className="block h-1 rounded bg-current opacity-25" />
                  <span className="block h-1 rounded bg-current opacity-25" />
                </span>
                <span className="flex-1 space-y-2 pt-1">
                  <span className="block h-1.5 w-3/4 rounded bg-current opacity-50" />
                  <span className="block h-5 rounded border border-border/60 bg-primary/10" />
                  <span className="flex gap-1"><span className="h-5 flex-1 rounded bg-current opacity-10" /><span className="h-5 flex-1 rounded bg-current opacity-10" /></span>
                </span>
              </span>
            ))}
            {theme === "scheduled" ? <Clock3 className="absolute bottom-1.5 end-1.5 h-4 w-4 text-alios-paper" /> : null}
          </span> : null}
          <span className="flex w-full flex-wrap items-center justify-center gap-2"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{t(labelKey)}{value === theme ? <Check className="h-4 w-4" aria-hidden="true" /> : null}</span>
        </Button>
      ))}
    </div>
  );
}

const accentLabels: Record<(typeof accentColorPreferences)[number], TranslationKey> = {
  default: "settings.accentDefault",
  violet: "settings.accentViolet",
  rose: "settings.accentRose",
  amber: "settings.accentAmber",
  emerald: "settings.accentEmerald",
  slate: "settings.accentSlate",
  caspian: "settings.accentCaspian",
  pomegranate: "settings.accentPomegranate",
  saffron: "settings.accentSaffron",
  herb: "settings.accentHerb",
};

export function AccentColorSettings() {
  const { t } = useI18n();
  const { value, setValue, persistenceFailed } = useAccentColorPreference();
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t("settings.accentColor")}</CardTitle>
        <CardDescription>{t("settings.accentColorDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {persistenceFailed ? <p role="alert" className="text-sm text-destructive">{t("settings.localPersistenceError")}</p> : null}
        <div role="group" aria-label={t("settings.accentColor")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {accentColorPreferences.map((accent) => (
            <Button
              key={accent}
              type="button"
              variant={value === accent ? "secondary" : "outline"}
              aria-pressed={value === accent}
              className="justify-start px-3"
              onClick={() => setValue(accent)}
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: `hsl(${getAccentColorThemeVariables(accent, false).primary})` }}
              />
              <span className="min-w-0 flex-1 break-words text-start">{t(accentLabels[accent])}</span>
              {value === accent ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
