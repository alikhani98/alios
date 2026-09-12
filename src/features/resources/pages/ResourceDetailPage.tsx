import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { Goal, KnowledgeItem, Project, Resource, Task } from "@/shared/types";
import {
  Badge,
  Button,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { QuickAccessToggleButton } from "@/shared/quickAccess";
import {
  RESOURCE_FORMAT_LABEL_KEYS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_LABEL_KEYS,
} from "../constants";
import {
  deriveResourceRelationshipContext,
  type ResourceRelationship,
} from "../resourceRelationships";
import {
  resolveResourceLearningContext,
  type ResourceLearningContext,
  type ResourceLearningRelationship,
} from "../resourceLearningContext";

type DetailState = {
  resource: Resource | null;
  knowledgeItems: KnowledgeItem[];
  directGoal?: Goal;
  directProject?: Project;
  directTask?: Task;
  derivedGoals: ResourceRelationship[];
  derivedProjects: ResourceRelationship[];
  derivedTasks: ResourceRelationship[];
  learningContext?: ResourceLearningContext;
};

export function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const {
    resources: resourceRepository,
    knowledge: knowledgeRepository,
    goals: goalsRepository,
    projects: projectsRepository,
    tasks: tasksRepository,
  } = useStorageAdapter();
  const [state, setState] = useState<DetailState>({
    resource: null,
    knowledgeItems: [],
    derivedGoals: [],
    derivedProjects: [],
    derivedTasks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!resourceId) {
      setIsLoading(false);
      setError(true);
      return undefined;
    }

    setIsLoading(true);
    void Promise.all([
      resourceRepository.getById(resourceId),
      knowledgeRepository.list(),
      goalsRepository.list(),
      projectsRepository.list(),
      tasksRepository.list(),
    ])
      .then(([resource, knowledgeItems, goals, projects, tasks]) => {
        if (isCancelled) {
          return;
        }

        const relationshipContext = resource
          ? deriveResourceRelationshipContext(
              resource,
              knowledgeItems,
              goals,
              projects,
              tasks
            )
          : {
              directGoal: undefined,
              directProject: undefined,
              directTask: undefined,
              derivedGoals: [],
              derivedProjects: [],
              derivedTasks: [],
            };
        const learningContext = resource
          ? resolveResourceLearningContext({
              resource,
              knowledgeItems,
              goals,
              projects,
              tasks,
            })
          : undefined;

        setState({
          resource: resource ?? null,
          knowledgeItems: knowledgeItems.filter(
            (item) => item.resourceId === resource?.id
          ),
          ...relationshipContext,
          learningContext,
        });
        setError(false);
      })
      .catch(() => {
        if (!isCancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    goalsRepository,
    knowledgeRepository,
    projectsRepository,
    resourceId,
    resourceRepository,
    tasksRepository,
  ]);

  if (isLoading) {
    return (
      <section className="alios-page">
        <div
          className="h-64 animate-pulse rounded-2xl border bg-muted/60"
          aria-label={t("resources.loading")}
        />
      </section>
    );
  }

  if (error || !state.resource) {
    return (
      <section className="alios-page">
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={t("resources.detailNotFoundTitle")}
          description={t("resources.detailNotFoundDescription")}
          actions={
            <Button type="button" variant="outline" onClick={() => navigate("/resources")}>
              <ArrowLeft className="me-2 h-4 w-4" aria-hidden="true" />
              {t("resources.backToLibrary")}
            </Button>
          }
        />
      </section>
    );
  }

  const resource = state.resource;
  const statusLabel = RESOURCE_STATUS_OPTIONS.find(
    (option) => option.value === resource.status
  );

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <Button asChild type="button" variant="ghost" className="w-fit px-0">
            <Link to="/resources">
              <ArrowLeft className="me-2 h-4 w-4" aria-hidden="true" />
              {t("resources.backToLibrary")}
            </Link>
          </Button>
          <SectionHeader
            icon={<BookOpen className="h-5 w-5" />}
            title={resource.title}
            description={t("resources.detailDescription")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t(RESOURCE_TYPE_LABEL_KEYS[resource.type])}</Badge>
            {statusLabel ? <Badge variant="outline">{t(statusLabel.labelKey)}</Badge> : null}
            {resource.format ? (
              <Badge variant="outline">
                {t(RESOURCE_FORMAT_LABEL_KEYS[resource.format])}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickAccessToggleButton itemType="resource" targetId={resource.id} />
          </div>
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader>
          <CardTitle>{t("resources.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {resource.author ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("resources.author")}</dt>
                <dd className="mt-1 break-words font-medium">{resource.author}</dd>
              </div>
            ) : null}
            {resource.location ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("resources.location")}</dt>
                <dd className="mt-1 break-words font-medium">{resource.location}</dd>
              </div>
            ) : null}
            {resource.progressPercent !== undefined ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("resources.progress")}</dt>
                <dd className="mt-1 font-medium">
                  {t("resources.progressValue", { count: resource.progressPercent })}
                </dd>
              </div>
            ) : null}
            {resource.startedAt ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("resources.startedAt")}</dt>
                <dd className="mt-1 font-medium">{formatDate(resource.startedAt)}</dd>
              </div>
            ) : null}
            {resource.completedAt ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("resources.completedAt")}</dt>
                <dd className="mt-1 font-medium">{formatDate(resource.completedAt)}</dd>
              </div>
            ) : null}
          </dl>
          {resource.description ? (
            <div>
              <h2 className="text-sm font-semibold">{t("common.description")}</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                {resource.description}
              </p>
            </div>
          ) : null}
          {resource.source ? (
            <p className="break-words text-sm text-muted-foreground">
              {t("resources.source")}: {resource.source}
            </p>
          ) : null}
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-start gap-2 text-sm text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{resource.url}</span>
            </a>
          ) : null}
        </CardContent>
      </PremiumCard>

      {(state.knowledgeItems.length > 0 ||
        resource.goalId ||
        resource.projectId ||
        resource.taskId ||
        state.derivedGoals.length > 0 ||
        state.derivedProjects.length > 0 ||
        state.derivedTasks.length > 0) ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>{t("resources.relatedItems")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.knowledgeItems.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold">{t("resources.relatedKnowledge")}</h2>
                <ul className="mt-2 space-y-2">
                  {state.knowledgeItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        className="text-sm text-primary underline-offset-4 hover:underline"
                        to={`/knowledge?focusId=${encodeURIComponent(item.id)}`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {resource.goalId || resource.projectId || resource.taskId ? (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">
                  {t("resources.directRelationships")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {resource.goalId ? (
                    <RelatedLink
                      label={t("links.goalLabel")}
                      title={state.directGoal?.title}
                      unavailable={t("links.goalUnavailable")}
                      href={
                        state.directGoal
                          ? `/goals?focusId=${encodeURIComponent(state.directGoal.id)}`
                          : undefined
                      }
                      openLabel={t("links.openGoal")}
                    />
                  ) : null}
                  {resource.projectId ? (
                    <RelatedLink
                      label={t("links.projectLabel")}
                      title={state.directProject?.title}
                      unavailable={t("links.projectUnavailable")}
                      href={
                        state.directProject
                          ? `/projects?focusId=${encodeURIComponent(state.directProject.id)}`
                          : undefined
                      }
                      openLabel={t("links.openProject")}
                    />
                  ) : null}
                  {resource.taskId ? (
                    <RelatedLink
                      label={t("links.taskLabel")}
                      title={state.directTask?.title}
                      unavailable={t("links.taskUnavailable")}
                      href={
                        state.directTask
                          ? `/today?focusId=${encodeURIComponent(state.directTask.id)}`
                          : undefined
                      }
                      openLabel={t("links.openTask")}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
            {state.derivedGoals.length > 0 ||
            state.derivedProjects.length > 0 ||
            state.derivedTasks.length > 0 ? (
              <div className="space-y-4 border-t border-border/70 pt-4">
                <h2 className="text-sm font-semibold">
                  {t("resources.derivedContext")}
                </h2>
                <DerivedRelationshipGroup
                  label={t("resources.derivedGoals")}
                  items={state.derivedGoals}
                  provenanceLabel={t("resources.fromProvenance")}
                  provenanceLabels={{
                    direct: t("resources.provenanceDirect"),
                    knowledge: t("resources.provenanceKnowledge"),
                    project: t("resources.provenanceProject"),
                    task: t("resources.provenanceTask"),
                  }}
                  hrefPrefix="/goals?focusId="
                />
                <DerivedRelationshipGroup
                  label={t("resources.derivedProjects")}
                  items={state.derivedProjects}
                  provenanceLabel={t("resources.fromProvenance")}
                  provenanceLabels={{
                    direct: t("resources.provenanceDirect"),
                    knowledge: t("resources.provenanceKnowledge"),
                    project: t("resources.provenanceProject"),
                    task: t("resources.provenanceTask"),
                  }}
                  hrefPrefix="/projects?focusId="
                />
                <DerivedRelationshipGroup
                  label={t("resources.derivedTasks")}
                  items={state.derivedTasks}
                  provenanceLabel={t("resources.fromProvenance")}
                  provenanceLabels={{
                    direct: t("resources.provenanceDirect"),
                    knowledge: t("resources.provenanceKnowledge"),
                    project: t("resources.provenanceProject"),
                    task: t("resources.provenanceTask"),
                  }}
                  hrefPrefix="/today?focusId="
                />
              </div>
            ) : null}
          </CardContent>
        </PremiumCard>
      ) : null}
      {state.learningContext &&
      (state.learningContext.relatedGoals.length > 0 ||
        state.learningContext.relatedProjects.length > 0 ||
        state.learningContext.relatedTasks.length > 0 ||
        state.learningContext.relatedKnowledge.length > 0) ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>{t("resources.learningContext")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {t("resources.learningContextDescription")}
            </p>
            <ResourceLearningGroup
              label={t("resources.learningGoals")}
              items={state.learningContext.relatedGoals}
              unavailable={t("links.goalUnavailable")}
              hrefPrefix="/goals?focusId="
              sourceLabels={{
                direct: t("resources.learningSourceDirect"),
                project: t("resources.learningSourceProject"),
                task: t("resources.learningSourceTask"),
                knowledge: t("resources.learningSourceKnowledge"),
              }}
              sourcePrefix={t("resources.learningSourcePrefix")}
            />
            <ResourceLearningGroup
              label={t("resources.learningProjects")}
              items={state.learningContext.relatedProjects}
              unavailable={t("links.projectUnavailable")}
              hrefPrefix="/projects?focusId="
              sourceLabels={{
                direct: t("resources.learningSourceDirect"),
                project: t("resources.learningSourceProject"),
                task: t("resources.learningSourceTask"),
                knowledge: t("resources.learningSourceKnowledge"),
              }}
              sourcePrefix={t("resources.learningSourcePrefix")}
            />
            <ResourceLearningGroup
              label={t("resources.learningTasks")}
              items={state.learningContext.relatedTasks}
              unavailable={t("links.taskUnavailable")}
              hrefPrefix="/today?focusId="
              sourceLabels={{
                direct: t("resources.learningSourceDirect"),
                project: t("resources.learningSourceProject"),
                task: t("resources.learningSourceTask"),
                knowledge: t("resources.learningSourceKnowledge"),
              }}
              sourcePrefix={t("resources.learningSourcePrefix")}
            />
            <ResourceLearningGroup
              label={t("resources.learningKnowledge")}
              items={state.learningContext.relatedKnowledge}
              unavailable={t("links.relatedKnowledgeUnavailable")}
              hrefPrefix="/knowledge?focusId="
              sourceLabels={{
                direct: t("resources.learningSourceDirect"),
                project: t("resources.learningSourceProject"),
                task: t("resources.learningSourceTask"),
                knowledge: t("resources.learningSourceKnowledge"),
              }}
              sourcePrefix={t("resources.learningSourcePrefix")}
            />
          </CardContent>
        </PremiumCard>
      ) : null}
    </section>
  );
}

function ResourceLearningGroup({
  label,
  items,
  unavailable,
  hrefPrefix,
  sourceLabels,
  sourcePrefix,
}: {
  label: string;
  items: ReadonlyArray<ResourceLearningRelationship>;
  unavailable: string;
  hrefPrefix: string;
  sourceLabels: Record<ResourceLearningRelationship["provenance"], string>;
  sourcePrefix: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">{label}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${label}-${item.id}`} className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            {item.title ? (
              <Link
                className="min-w-0 break-words text-primary underline-offset-4 hover:underline"
                to={`${hrefPrefix}${encodeURIComponent(item.id)}`}
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-muted-foreground">{unavailable}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {sourcePrefix}: {sourceLabels[item.provenance]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DerivedRelationshipGroup({
  label,
  items,
  provenanceLabel,
  provenanceLabels,
  hrefPrefix,
}: {
  label: string;
  items: ReadonlyArray<ResourceRelationship>;
  provenanceLabel: string;
  provenanceLabels: Record<ResourceRelationship["provenance"], string>;
  hrefPrefix: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">{label}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <Link
              className="min-w-0 break-words text-primary underline-offset-4 hover:underline"
              to={`${hrefPrefix}${encodeURIComponent(item.id)}`}
            >
              {item.title}
            </Link>
            <span className="text-xs text-muted-foreground">
              {provenanceLabel}: {provenanceLabels[item.provenance]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedLink({
  label,
  title,
  unavailable,
  href,
  openLabel,
}: {
  label: string;
  title?: string;
  unavailable: string;
  href?: string;
  openLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {title && href ? (
        <div className="mt-2 flex min-w-0 flex-col gap-2">
          <p className="break-words text-sm font-medium">{title}</p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to={href}>{openLabel}</Link>
          </Button>
        </div>
      ) : (
        <p className="mt-2 break-words text-sm text-muted-foreground">{unavailable}</p>
      )}
    </div>
  );
}
