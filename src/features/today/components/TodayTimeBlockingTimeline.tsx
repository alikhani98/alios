import { Clock3 } from "lucide-react";

import type { Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { CollapsibleSection, SoftPanel, StatusChip } from "@/shared/ui";

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 22;

type ScheduledTimelineTask = Task & {
  scheduledStartTime: string;
  estimatedMinutes: number;
};

type TodayTimeBlockingTimelineProps = {
  tasks: ReadonlyArray<Task>;
};

function isScheduledTimelineTask(task: Task): task is ScheduledTimelineTask {
  return Boolean(task.scheduledStartTime && task.estimatedMinutes);
}

function getTaskHour(task: ScheduledTimelineTask) {
  return Number(task.scheduledStartTime.slice(0, 2));
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours > 0 && remainder > 0) {
    return `${hours}h ${remainder}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function TodayTimeBlockingTimeline({ tasks }: TodayTimeBlockingTimelineProps) {
  const { t } = useI18n();
  const scheduledTasks = tasks
    .filter(isScheduledTimelineTask)
    .sort((left, right) =>
      left.scheduledStartTime.localeCompare(right.scheduledStartTime)
    );
  const hours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_value, index) => TIMELINE_START_HOUR + index
  );

  return (
    <CollapsibleSection
      id="today-time-blocking"
      title={t("today.timeBlockingTitle")}
      description={t("today.timeBlockingDescription")}
      icon={<Clock3 className="h-5 w-5" />}
      status={
        scheduledTasks.length > 0 ? (
          <StatusChip tone="neutral">{scheduledTasks.length}</StatusChip>
        ) : null
      }
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      contentClassName="space-y-3"
      className="border-border/70 bg-card/95"
    >
      {scheduledTasks.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {t("today.timeBlockingEmpty")}
        </p>
      ) : (
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourTasks = scheduledTasks.filter((task) => getTaskHour(task) === hour);
            const hourLabel = `${String(hour).padStart(2, "0")}:00`;

            return (
              <div
                key={hour}
                className="grid gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
              >
                <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground">
                  {hourLabel}
                </span>
                {hourTasks.length > 0 ? (
                  <div className="grid gap-2">
                    {hourTasks.map((task) => (
                      <SoftPanel
                        key={task.id}
                        className="gap-2 border-alios-saffron/35 bg-alios-saffron/10"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="min-w-0 flex-1 break-words text-sm font-semibold">
                            {task.title}
                          </p>
                          <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                            {task.scheduledStartTime}
                          </span>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {t("today.timeBlockingTaskDuration", {
                            duration: formatDuration(task.estimatedMinutes),
                          })}
                        </p>
                      </SoftPanel>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("today.timeBlockingNoBlock")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
