import * as React from "react";

import { cn } from "@/shared/utils";
import {
  aliosSectionMotion,
  aliosSubtleOutlineMotion,
} from "./motion";

import { Card, CardContent } from "./card";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

function toneClassName(tone: Tone) {
  switch (tone) {
    case "primary":
      return "border-transparent bg-primary/10 text-primary";
    case "success":
      return "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "warning":
      return "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "danger":
      return "border-transparent bg-destructive/10 text-destructive";
    case "neutral":
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

export type PremiumCardProps = React.HTMLAttributes<HTMLDivElement>;

export function PremiumCard({ className, ...props }: PremiumCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm backdrop-blur-sm",
        "hover:border-primary/20 hover:shadow-lg",
        className
      )}
      {...props}
    />
  );
}

export type SoftPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function SoftPanel({ className, ...props }: SoftPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm",
        aliosSubtleOutlineMotion,
        "hover:border-border/90 hover:bg-background",
        className
      )}
      {...props}
    />
  );
}

export type SectionHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  status?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  status,
  icon,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        aliosSectionMotion,
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <h3 className="break-words text-xl font-semibold tracking-tight sm:text-[1.35rem]">
            {title}
          </h3>
          {status ? <div className="shrink-0">{status}</div> : null}
        </div>
        {description ? (
          <p className="max-w-3xl break-words text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type StatusChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function StatusChip({
  tone = "neutral",
  className,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none",
        aliosSubtleOutlineMotion,
        "hover:border-border/80",
        toneClassName(tone),
        className
      )}
      {...props}
    />
  );
}

export type MiniProgressBarProps = {
  value: number;
  className?: string;
  label?: React.ReactNode;
};

export function MiniProgressBar({ value, className, label }: MiniProgressBarProps) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export type MetricCardProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  className?: string;
};

export function MetricCard({
  icon,
  label,
  value,
  description,
  status,
  className,
}: MetricCardProps) {
  return (
    <PremiumCard className={cn("h-full min-h-40", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-primary/10 bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
          {status ? <div className="shrink-0">{status}</div> : null}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="text-[1.85rem] font-semibold tabular-nums leading-none tracking-tight sm:text-[2.25rem]">
            {value}
          </p>
          {description ? (
            <p className="break-words text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </PremiumCard>
  );
}

export type InsightStatCardProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  progress?: number | null;
  progressLabel?: React.ReactNode;
  status?: React.ReactNode;
  className?: string;
};

export function InsightStatCard({
  icon,
  label,
  value,
  description,
  progress,
  progressLabel,
  status,
  className,
}: InsightStatCardProps) {
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);

  return (
    <PremiumCard className={cn("h-full min-h-44", className)}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/10 bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
          {status ? <div className="shrink-0">{status}</div> : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="text-[2rem] font-semibold tabular-nums tracking-tight sm:text-[2.25rem]">
            {value}
          </p>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {hasProgress ? (
          <MiniProgressBar value={progress ?? 0} label={progressLabel} />
        ) : null}
      </CardContent>
    </PremiumCard>
  );
}

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <PremiumCard className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-8">
        {icon ? (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-primary/10 bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
        ) : null}
        <h3 className="break-words text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </PremiumCard>
  );
}
