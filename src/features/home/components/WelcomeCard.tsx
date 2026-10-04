import { Button, Card, CardContent } from "@/shared/ui";
import { useI18n } from "@/shared/i18n";

interface WelcomeCardProps {
  displayName?: string;
}

const quickStartLinks = [
  { href: "/#/today", icon: "📋", labelKey: "home.welcomeToday" },
  { href: "/#/inbox", icon: "📥", labelKey: "home.welcomeInbox" },
  { href: "/#/goals", icon: "🎯", labelKey: "home.welcomeGoals" },
] as const;

export function WelcomeCard({ displayName }: WelcomeCardProps) {
  const { t } = useI18n();
  const trimmedDisplayName = displayName?.trim();
  const greeting = trimmedDisplayName
    ? t("home.welcomeGreetingNamed", { name: trimmedDisplayName })
    : t("home.welcomeGreeting");

  return (
    <Card className="border-alios-saffron/25 bg-[var(--alios-night-garden)] text-alios-paper shadow-sm hover:border-alios-saffron/35">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="break-words text-sm font-semibold text-alios-saffron">
            {greeting}
          </p>
          <h2 className="break-words text-2xl font-semibold tracking-tight">
            {t("home.welcomeTitle")}
          </h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {quickStartLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="outline"
              className="justify-start border-alios-saffron/30 bg-alios-saffron/10 text-alios-paper hover:bg-alios-saffron/20 hover:text-alios-paper sm:w-auto"
            >
              <a href={link.href}>
                <span aria-hidden="true">{link.icon}</span>
                {t(link.labelKey)}
              </a>
            </Button>
          ))}
        </div>

        <p className="break-words text-xs leading-6 text-alios-paper/70">
          {t("home.welcomeLocalNote")}
        </p>
      </CardContent>
    </Card>
  );
}
