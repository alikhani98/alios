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
import {
  filterSearchResults,
  searchLocalData,
  type SearchResult,
  type SearchResultKind,
} from "../searchLocalData";

const searchResultKindOrder: SearchResultKind[] = [
  "inbox",
  "task",
  "routine",
  "project",
  "goal",
  "lifeArea",
  "journal",
  "knowledge",
  "manual",
];

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
  const [selectedKinds, setSelectedKinds] = useState<SearchResultKind[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAllResults, setShowAllResults] = useState(false);

  const rawResults = useMemo(() => (data ? searchLocalData(data, query) : []), [data, query]);
  const results = useMemo(
    () =>
      filterSearchResults(rawResults, {
        kinds: selectedKinds,
        dateFrom,
        dateTo,
      }),
    [dateFrom, dateTo, rawResults, selectedKinds]
  );
  const hasQuery = query.trim().length > 0;
  const hasFilters = selectedKinds.length > 0 || dateFrom.length > 0 || dateTo.length > 0;
  const resultPreviewLimit = 12;
  const displayedResults = showAllResults
    ? results
    : results.slice(0, resultPreviewLimit);
  const hiddenResultCount = Math.max(results.length - displayedResults.length, 0);
  const toggleKind = (kind: SearchResultKind) => {
    setSelectedKinds((current) =>
      current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind]
    );
    setShowAllResults(false);
  };
  const clearFilters = () => {
    setSelectedKinds([]);
    setDateFrom("");
    setDateTo("");
    setShowAllResults(false);
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface">
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
            <Search className="h-5 w-5 text-alios-caspian dark:text-alios-paper" />
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
              onChange={(event) => {
                setQuery(event.target.value);
                setShowAllResults(false);
              }}
              placeholder={t("search.placeholder")}
              className={direction === "rtl" ? "h-11 pr-9" : "h-11 pl-9"}
            />
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("search.typeFilterLabel")}
                </p>
                {hasFilters ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    {t("search.clearFilters")}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2" aria-label={t("search.typeFilterLabel")}>
                {searchResultKindOrder.map((kind) => {
                  const active = selectedKinds.includes(kind);
                  const labelKey = `search.type${kind[0].toUpperCase()}${kind.slice(1)}` as SearchResult["kindLabelKey"];
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleKind(kind)}
                      className={cn(
                        "min-h-11 rounded-full border px-3 py-2 text-sm font-medium transition-colors sm:min-h-10",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {t(labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>{t("search.dateFromLabel")}</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setShowAllResults(false);
                  }}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>{t("search.dateToLabel")}</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setShowAllResults(false);
                  }}
                />
              </label>
            </div>
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
            {displayedResults.map((result) => (
              <SearchResultCard
                key={`${result.kind}-${result.href}-${result.title}`}
                result={result}
              />
            ))}
          </div>
          {results.length > resultPreviewLimit ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowAllResults((current) => !current)}
            >
              {showAllResults
                ? t("common.showFewer")
                : t("common.showMoreCount", { count: hiddenResultCount })}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
