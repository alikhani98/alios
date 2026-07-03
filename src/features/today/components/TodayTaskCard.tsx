import { Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Task, TaskStatus } from "@/shared/types";
import { Badge, Button, Card, CardContent } from "@/shared/ui";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_OPTIONS,
} from "../constants";

type TodayTaskCardProps = {
  task: Task;
  isBusy: boolean;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onSelectMit: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TodayTaskCard({
  task,
  isBusy,
  onEdit,
  onStatusChange,
  onSelectMit,
  onDelete,
}: TodayTaskCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const completed = task.status === "done" || task.status === "cancelled";

  return (
    <Card className={completed ? "bg-muted/40" : undefined}>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={
                completed
                  ? "font-semibold text-muted-foreground line-through"
                  : "font-semibold"
              }
            >
              {task.title}
            </h3>
            {task.isMit ? (
              <Badge>
                <Star className="me-1 h-3.5 w-3.5 fill-current" />
                MIT
              </Badge>
            ) : null}
            <Badge variant="outline">
              {TASK_PRIORITY_LABELS[task.priority]} priority
            </Badge>
          </div>
          {task.description ? (
            <p className="text-sm leading-7 text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={`Status for ${task.title}`}
            value={task.status}
            disabled={isBusy}
            onChange={(event) =>
              void onStatusChange(event.target.value as TaskStatus)
            }
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {!task.isMit ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isBusy}
              onClick={() => void onSelectMit()}
            >
              <Star className="me-2 h-4 w-4" />
              Make MIT
            </Button>
          ) : null}

          {confirmingDelete ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isBusy}
                onClick={() => void onDelete()}
              >
                {isBusy ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="me-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
