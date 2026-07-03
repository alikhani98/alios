import type { KnowledgeItemType } from "@/shared/types";

export const KNOWLEDGE_TYPE_OPTIONS: ReadonlyArray<{
  value: KnowledgeItemType;
  label: string;
}> = [
  { value: "note", label: "Note" },
  { value: "lesson", label: "Lesson" },
  { value: "rule", label: "Rule" },
  { value: "checklist", label: "Checklist" },
  { value: "sop", label: "SOP" },
  { value: "prompt", label: "Prompt" },
  { value: "resource", label: "Resource" },
  { value: "template", label: "Template" },
];

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeItemType, string> = {
  note: "Note",
  lesson: "Lesson",
  rule: "Rule",
  checklist: "Checklist",
  sop: "SOP",
  prompt: "Prompt",
  resource: "Resource",
  template: "Template",
};
