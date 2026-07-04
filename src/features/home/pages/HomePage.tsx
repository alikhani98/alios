import { PagePlaceholder } from "@/shared/ui";
import { useI18n } from "@/shared/i18n";

export function HomePage() {
  const { t } = useI18n();
  return (
    <PagePlaceholder
      title={t("home.title")}
      description={t("home.description")}
    />
  );
}
