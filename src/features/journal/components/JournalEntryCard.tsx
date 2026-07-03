import { BatteryMedium, CalendarDays, Heart, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { JournalEntry } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { JOURNAL_TYPE_LABELS, LEVEL_LABELS } from "../constants";

type JournalEntryCardProps = {
  entry: JournalEntry;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function JournalEntryCard({
  entry,
  isDeleting,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="leading-7">{entry.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {JOURNAL_TYPE_LABELS[entry.type]}
            </Badge>
            <Badge variant="outline">
              <CalendarDays className="me-1 h-3.5 w-3.5" />
              {entry.date}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {entry.content}
        </p>
        {entry.moodLevel || entry.energyLevel ? (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {entry.moodLevel ? (
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Mood: {LEVEL_LABELS[entry.moodLevel]}
              </span>
            ) : null}
            {entry.energyLevel ? (
              <span className="flex items-center gap-2">
                <BatteryMedium className="h-4 w-4" />
                Energy: {LEVEL_LABELS[entry.energyLevel]}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t pt-4">
        {confirmingDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? "Deleting…" : "Confirm delete"}
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
      </CardFooter>
    </Card>
  );
}
