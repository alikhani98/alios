import { addDays, format, parseISO } from "date-fns";

import type { FinanceObligation, Task } from "@/shared/types";

export type CalendarExportFindingCode =
  | "task_time_without_timezone"
  | "finance_due_day_without_date";

export type CalendarExportFinding = Readonly<{
  code: CalendarExportFindingCode;
  entityId: string;
  title: string;
}>;

export type CalendarExportInput = Readonly<{
  tasks: ReadonlyArray<Task>;
  obligations: ReadonlyArray<FinanceObligation>;
}>;

export type CalendarExportBundle = Readonly<{
  content: string;
  eventCount: number;
  findings: ReadonlyArray<CalendarExportFinding>;
}>;

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

function foldIcsLine(line: string): string {
  const chunks: string[] = [];
  let current = "";
  let currentOctets = 0;

  for (const character of line) {
    const octets = new TextEncoder().encode(character).length;
    if (current && currentOctets + octets > 75) {
      chunks.push(current);
      current = ` ${character}`;
      currentOctets = 1 + octets;
    } else {
      current += character;
      currentOctets += octets;
    }
  }

  if (current) chunks.push(current);
  return chunks.join("\r\n");
}

function serializeIcsLines(lines: ReadonlyArray<string>): string {
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function getTaskStatus(task: Task): "NEEDS-ACTION" | "COMPLETED" | "CANCELLED" {
  if (task.status === "done") return "COMPLETED";
  if (task.status === "cancelled") return "CANCELLED";
  return "NEEDS-ACTION";
}

function isExportableTask(task: Task): boolean {
  return Boolean(task.dueDate) && task.status !== "done" && task.status !== "cancelled";
}

function isExportableObligation(obligation: FinanceObligation): boolean {
  return obligation.status === "active" && Boolean(obligation.dueDate);
}

function buildTaskEvent(
  task: Task,
  exportedAt: string
): ReadonlyArray<string> {
  const dueDate = task.dueDate;
  if (!dueDate) return [];

  const endDate = format(addDays(parseISO(dueDate), 1), "yyyy-MM-dd");
  const description = [task.description, "Created in AliOS."].filter(Boolean).join("\n\n");

  return [
    "BEGIN:VEVENT",
    `UID:task:${escapeIcsText(task.id)}@alios.local`,
    `DTSTAMP:${exportedAt}`,
    `DTSTART;VALUE=DATE:${toIcsDate(dueDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(task.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `STATUS:${getTaskStatus(task)}`,
    "END:VEVENT",
  ];
}

function buildObligationEvent(
  obligation: FinanceObligation,
  exportedAt: string
): ReadonlyArray<string> {
  const dueDate = obligation.dueDate;
  if (!dueDate) return [];

  const endDate = format(addDays(parseISO(dueDate), 1), "yyyy-MM-dd");
  const description = [
    obligation.notes,
    obligation.counterparty
      ? `Counterparty: ${obligation.counterparty}`
      : undefined,
    "Created in AliOS.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    "BEGIN:VEVENT",
    `UID:finance-obligation:${escapeIcsText(obligation.id)}@alios.local`,
    `DTSTAMP:${exportedAt}`,
    `DTSTART;VALUE=DATE:${toIcsDate(dueDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(obligation.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ];
}

export function createCalendarIcsExportBundle(
  input: CalendarExportInput,
  exportedAt = new Date()
): CalendarExportBundle {
  const timestamp = toIcsTimestamp(exportedAt);
  const findings: CalendarExportFinding[] = [];
  const events: string[] = [];

  for (const task of input.tasks) {
    if (!isExportableTask(task)) continue;

    if (task.scheduledStartTime) {
      findings.push({
        code: "task_time_without_timezone",
        entityId: task.id,
        title: task.title,
      });
    }

    events.push(...buildTaskEvent(task, timestamp));
  }

  for (const obligation of input.obligations) {
    if (isExportableObligation(obligation)) {
      events.push(...buildObligationEvent(obligation, timestamp));
    } else if (obligation.status === "active" && obligation.dueDay !== undefined) {
      findings.push({
        code: "finance_due_day_without_date",
        entityId: obligation.id,
        title: obligation.title,
      });
    }
  }

  const content = serializeIcsLines([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AliOS//Local Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ]);

  return {
    content,
    eventCount: input.tasks.filter(isExportableTask).length +
      input.obligations.filter(isExportableObligation).length,
    findings,
  };
}

export function downloadCalendarIcs(
  input: CalendarExportInput,
  exportedAt = new Date()
): CalendarExportBundle {
  const bundle = createCalendarIcsExportBundle(input, exportedAt);
  const blob = new Blob([bundle.content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `alios-calendar-${format(exportedAt, "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return bundle;
}
