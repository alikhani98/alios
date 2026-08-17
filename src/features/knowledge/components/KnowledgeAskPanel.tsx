import { Bot, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { KnowledgeRepository } from "@/core/repositories";
import { useI18n } from "@/shared/i18n";
import type { KnowledgeItem } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";

import {
  searchKnowledgeItems,
  type KnowledgeSearchResult,
} from "../knowledgeSearch";

type KnowledgeAskPanelProps = {
  knowledgeRepository: KnowledgeRepository;
};

export function KnowledgeAskPanel({
  knowledgeRepository,
}: KnowledgeAskPanelProps) {
  const { direction, t } = useI18n();
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);
    setError(null);

    const timeout = window.setTimeout(() => {
      void knowledgeRepository
        .list()
        .then((items: KnowledgeItem[]) => {
          if (isCancelled) {
            return;
          }

          setResults(searchKnowledgeItems(items, trimmedQuestion));
          setHasSearched(true);
        })
        .catch(() => {
          if (isCancelled) {
            return;
          }

          setResults([]);
          setHasSearched(true);
          setError(t("knowledge.askError"));
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [knowledgeRepository, question, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
          {t("knowledge.askTitle")}
        </CardTitle>
        <CardDescription>{t("knowledge.askDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search
            className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
              direction === "rtl" ? "right-3" : "left-3"
            }`}
            aria-hidden="true"
          />
          <Input
            aria-label={t("knowledge.askInputLabel")}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("knowledge.askPlaceholder")}
            className={direction === "rtl" ? "pr-9" : "pl-9"}
          />
        </div>

        {isSearching ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          >
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("knowledge.askSearching")}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {!isSearching && hasSearched && !error && results.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-5 text-sm leading-7 text-muted-foreground">
            {t("knowledge.askEmpty")}
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result) => (
              <article
                key={result.item.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="min-w-0 flex-1 break-words text-base font-semibold">
                    {result.item.title}
                  </h3>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to={`/knowledge?focusId=${encodeURIComponent(
                        result.item.id
                      )}`}
                    >
                      {t("knowledge.askOpenResult")}
                    </Link>
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {result.excerpt.map((segment, index) =>
                    segment.highlighted ? (
                      <mark
                        key={`${segment.text}-${index}`}
                        className="rounded bg-primary/15 px-1 text-foreground"
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={`${segment.text}-${index}`}>{segment.text}</span>
                    )
                  )}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
