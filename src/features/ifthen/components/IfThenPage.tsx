import { GitBranch, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { AddIfThenPlanInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { IfThenPlan } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { IfThenForm } from "./IfThenForm";

function PlanRow({
  plan,
  isBusy,
  onToggle,
  onDelete,
}: {
  plan: IfThenPlan;
  isBusy: boolean;
  onToggle: (plan: IfThenPlan) => void;
  onDelete: (plan: IfThenPlan) => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "alios-surface-muted flex min-w-0 items-start justify-between gap-3 p-3",
        plan.isActive ? null : "opacity-70"
      )}
    >
      <p className="min-w-0 break-words text-sm font-medium leading-6">
        {t("ifthen.planText", {
          ifTrigger: plan.ifTrigger,
          thenAction: plan.thenAction,
        })}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 px-2 text-xs"
          disabled={isBusy}
          onClick={() => onToggle(plan)}
        >
          {plan.isActive ? t("ifthen.deactivate") : t("ifthen.activate")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 px-2 text-xs text-destructive hover:text-destructive"
          disabled={isBusy}
          onClick={() => onDelete(plan)}
        >
          <Trash2 className="me-1 h-4 w-4" aria-hidden="true" />
          {t("ifthen.delete")}
        </Button>
      </div>
    </div>
  );
}

function PlanList({
  plans,
  busyPlanId,
  onToggle,
  onDelete,
}: {
  plans: IfThenPlan[];
  busyPlanId: string | null;
  onToggle: (plan: IfThenPlan) => void;
  onDelete: (plan: IfThenPlan) => void;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Badge variant="secondary" className="font-mono tabular-nums">
            {plans.length}
          </Badge>
        </div>
        {plans.length > 0 ? (
          plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              isBusy={busyPlanId === plan.id}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        ) : (
          <EmptyState
            icon={<GitBranch className="h-6 w-6" aria-hidden="true" />}
            title={t("ifthen.emptyActiveTitle")}
            description={t("ifthen.emptyActiveDescription")}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function IfThenPage() {
  const { t } = useI18n();
  const { ifThenPlans } = useStorageAdapter();
  const [plans, setPlans] = useState<IfThenPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPlans(await ifThenPlans.getAllPlans());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("ifthen.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [ifThenPlans, t]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleCreatePlan = async (data: AddIfThenPlanInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await ifThenPlans.addPlan(data);
      setIsFormOpen(false);
      await loadPlans();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("ifthen.saveError"));
      throw caught;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlan = async (plan: IfThenPlan) => {
    setBusyPlanId(plan.id);
    setError(null);
    try {
      await ifThenPlans.toggleActive(plan.id);
      await loadPlans();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("ifthen.saveError"));
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleDeletePlan = async (plan: IfThenPlan) => {
    if (!window.confirm(t("ifthen.deleteConfirm"))) {
      return;
    }

    setBusyPlanId(plan.id);
    setError(null);
    try {
      await ifThenPlans.deletePlan(plan.id);
      await loadPlans();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("ifthen.saveError"));
    } finally {
      setBusyPlanId(null);
    }
  };

  return (
    <section className="alios-page space-y-6">
      <SectionHeader
        icon={<GitBranch className="h-5 w-5" aria-hidden="true" />}
        title={t("ifthen.pageTitle")}
        actions={
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <Plus className="me-2 h-4 w-4" aria-hidden="true" />
            {t("ifthen.newButton")}
          </Button>
        }
      />

      {error ? (
        <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3" aria-label={t("common.loading")}>
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : (
        <PlanList
          plans={plans}
          busyPlanId={busyPlanId}
          onToggle={(plan) => void handleTogglePlan(plan)}
          onDelete={(plan) => void handleDeletePlan(plan)}
        />
      )}

      {error ? (
        <Button type="button" variant="outline" onClick={() => void loadPlans()}>
          <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
          {t("common.tryAgain")}
        </Button>
      ) : null}

      <IfThenForm
        open={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreatePlan}
      />
    </section>
  );
}
