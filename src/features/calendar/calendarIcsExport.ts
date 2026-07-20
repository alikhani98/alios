import { addDays, format, parseISO } from "date-fns";

import type { Task } from "@/shared/types";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(value: string): string {
  return value.replace(/-/g, "");
}

function toIcsTimestamp(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(value.getUTCSeconds())}Z`;
}

function getIcsStatus(status: Task["status"]): "NEEDS-ACTION" | "COMPLETED" | "CANCELLED" {
  if (status === "done") return "COMPLETED";
  if (status === "cancelled") return "CANCELLED";
  return "NEEDS-ACTION";
}

export function getCalendarExportTasks(tasks: ReadonlyArray<Task>): Task[] {
  return tasks.filter(
    (task) => Boolean(task.dueDate) && task.status !== "done" && task.status !== "cancelled"
  );
}

export function createCalendarIcsExport(
  tasks: ReadonlyArray<Task>,
  exportedAt = new Date()
): string {
  const timestamp = toIcsTimestamp(exportedAt);
  const events = getCalendarExportTasks(tasks).flatMap((task) => {
    const dueDate = task.dueDate;
    if (!dueDate) return [];
    const endDate = format(addDays(parseISO(dueDate), 1), "yyyy-MM-dd");
    const description = [task.description, "Created in AliOS."].filter(Boolean).join("\n\n");

    return [
      "BEGIN:VEVENT",
      `UID:${task.id}@alios.local`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(dueDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(task.title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `STATUS:${getIcsStatus(task.status)}`,
      "END:VEVENT",
    ];
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AliOS//Local Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadCalendarIcs(tasks: ReadonlyArray<Task>): void {
  const content = createCalendarIcsExport(tasks);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `alios-calendar-${format(new Date(), "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
