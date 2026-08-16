import { AlertTriangle, Clock3 } from "lucide-react";
import { useState } from "react";

import type { Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { CollapsibleSection, SoftPanel, StatusChip } from "@/shared/ui";
import { cn } from "@/shared/utils";

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 22;

type ScheduledTimelineTask = Task & {
  scheduledStartTime: string;
  estimatedMinutes: number;
};

type TodayTimeBlockingTimelineProps = {
  tasks: ReadonlyArray<Task>;
  onTaskScheduleChange?: (
    task: Task,
    scheduledStartTime: string
  ) => Promise<void>;
};

function isScheduledTimelineTask(task: Task): task is ScheduledTimelineTask {
  return Boolean(task.scheduledStartTime && task.estimatedMinutes);
}

function getTaskHour(task: ScheduledTimelineTask) {
  return Number(task.scheduledStartTime.slice(0, 2));
}

function getTaskMinute(task: ScheduledTimelineTask) {
  return Number(task.scheduledStartTime.slice(3, 5));
}

function getTaskRange(task: ScheduledTimelineTask) {
  const start = getTaskHour(task) * 60 + getTaskMinute(task);

  return {
    start,
    end: start + task.estimatedMinutes,
  };
}

export function findConflictingTimeBlockTaskIds(
  tasks: ReadonlyArray<Task>
): Set<string> {
  const scheduledTasks = tasks.filter(isScheduledTimelineTask);
  const conflictingIds = new Set<string>();

  scheduledTasks.forEach((task, index) => {
    const range = getTaskRange(task);

    scheduledTasks.slice(index + 1).forEach((candidate) => {
      const candidateRange = getTaskRange(candidate);
      const overlaps =
        range.start < candidateRange.end && candidateRange.start < range.end;

      if (overlaps) {
        conflictingIds.add(task.id);
        conflictingIds.add(candidate.id);
      }
    });
  });

  return conflictingIds;
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

export function TodayTimeBlockingTimeline({
  tasks,
  onTaskScheduleChange,
}: TodayTimeBlockingTimelineProps) {
  const { t } = useI18n();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const scheduledTasks = tasks
    .filter(isScheduledTimelineTask)
    .sort((left, right) =>
      left.scheduledStartTime.localeCompare(right.scheduledStartTime)
    );
  const conflictingTaskIds = findConflictingTimeBlockTaskIds(scheduledTasks);
  const hours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_value, index) => TIMELINE_START_HOUR + index
  );

  const handleDrop = (hour: number) => {
    const draggedTask = scheduledTasks.find((task) => task.id === draggedTaskId);
    setDraggedTaskId(null);

    if (!draggedTask || !onTaskScheduleChange) {
      return;
    }

    const nextStartTime = `${String(hour).padStart(2, "0")}:${String(
      getTaskMinute(draggedTask)
    ).padStart(2, "0")}`;

    if (nextStartTime === draggedTask.scheduledStartTime) {
      return;
    }

    void onTaskScheduleChange(draggedTask, nextStartTime);
  };

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
                className={cn(
                  "grid gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 sm:grid-cols-[4.5rem_minmax(0,1fr)]",
                  draggedTaskId ? "border-primary/30 bg-primary/5" : null
                )}
                onDragOver={(event) => {
                  if (onTaskScheduleChange) {
                    event.preventDefault();
                  }
                }}
                onDrop={() => handleDrop(hour)}
              >
                <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground">
                  {hourLabel}
                </span>
                {hourTasks.length > 0 ? (
                  <div className="grid gap-2">
                    {hourTasks.map((task) => (
                      <SoftPanel
                        key={task.id}
                        draggable={Boolean(onTaskScheduleChange)}
                        onDragStart={(event) => {
                          setDraggedTaskId(task.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", task.id);
                        }}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className={cn(
                          "gap-2 border-alios-saffron/35 bg-alios-saffron/10",
                          onTaskScheduleChange ? "cursor-grab active:cursor-grabbing" : null,
                          conflictingTaskIds.has(task.id)
                            ? "border-warning/70 bg-warning/10"
                            : null
                        )}
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
                        {conflictingTaskIds.has(task.id) ? (
                          <p className="inline-flex items-center gap-2 text-xs font-medium leading-5 text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("today.timeBlockingConflict")}
                          </p>
                        ) : null}
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
