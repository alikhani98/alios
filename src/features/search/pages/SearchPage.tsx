import { ArrowRight, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { searchLocalData, type SearchResult } from "../searchLocalData";

function SearchResultCard({ result }: { result: SearchResult }) {
  const { direction, t } = useI18n();
  const { formatDate } = useDateFormatter();

  return (
    <PremiumCard className="group transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="break-words text-base sm:text-lg">
              {result.title}
            </CardTitle>
            <CardDescription className="mt-2 break-words">
              {result.snippet || t("search.noSnippet")}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t(result.kindLabelKey)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {result.facets.map((facet) => (
            <Badge key={`${facet.labelKey}-${facet.valueKey}`} variant="outline">
              {t(facet.labelKey)}: {t(facet.valueKey)}
            </Badge>
          ))}
          {result.date ? (
            <Badge variant="outline">{`${t("common.date")}: ${formatDate(result.date)}`}</Badge>
          ) : null}
        </div>
        <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
          <Link to={result.href}>
            <ArrowRight
              className={cn(
                "me-2 h-4 w-4",
                direction === "rtl" ? "rotate-180" : null
              )}
            />
            {t("search.openModule")}
          </Link>
        </Button>
      </CardContent>
    </PremiumCard>
  );
}

export function SearchPage() {
  const { direction, t } = useI18n();
  const { data, hasError, isLoading, reload } = useGlobalSearch();
  const [query, setQuery] = useState("");

  const results = useMemo(() => (data ? searchLocalData(data, query) : []), [data, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <section className="alios-page space-y-6">
      <PremiumCard>
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<Search className="h-5 w-5" />}
            title={t("search.title")}
            description={t("search.description")}
          />
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {t("search.inputLabel")}
          </CardTitle>
          <CardDescription>{t("search.inputDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                direction === "rtl" ? "right-3" : "left-3"
              )}
            />
            <Input
              aria-label={t("search.inputLabel")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              className={direction === "rtl" ? "h-11 pr-9" : "h-11 pl-9"}
            />
          </div>
        </CardContent>
      </PremiumCard>

      {hasError ? (
        <PremiumCard className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-4 px-6 py-8">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("search.loadError")}</span>
            </div>
            <Button type="button" variant="outline" onClick={() => void reload()}>
              {t("common.tryAgain")}
            </Button>
          </CardContent>
        </PremiumCard>
      ) : null}

      {isLoading ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label={t("search.loading")}
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : !hasError && !hasQuery ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={t("search.emptyTitle")}
          description={t("search.emptyDescription")}
        />
      ) : !hasError && hasQuery && results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={t("search.noResultsTitle")}
          description={t("search.noResultsDescription")}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("search.resultsSummary", { count: results.length })}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((result) => (
              <SearchResultCard
                key={`${result.kind}-${result.href}-${result.title}`}
                result={result}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
