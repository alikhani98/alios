import type { KnowledgeItemType } from "@/shared/types";
import type { TranslationKey } from "@/shared/i18n";

export const KNOWLEDGE_TYPE_OPTIONS: ReadonlyArray<{
  value: KnowledgeItemType;
  labelKey: TranslationKey;
}> = [
  { value: "note", labelKey: "knowledge.note" },
  { value: "lesson", labelKey: "knowledge.lesson" },
  { value: "rule", labelKey: "knowledge.rule" },
  { value: "checklist", labelKey: "knowledge.checklist" },
  { value: "sop", labelKey: "knowledge.sop" },
  { value: "prompt", labelKey: "knowledge.prompt" },
  { value: "resource", labelKey: "knowledge.resource" },
  { value: "template", labelKey: "knowledge.template" },
];

export const KNOWLEDGE_TYPE_LABEL_KEYS: Record<KnowledgeItemType, TranslationKey> = {
  note: "knowledge.note",
  lesson: "knowledge.lesson",
  rule: "knowledge.rule",
  checklist: "knowledge.checklist",
  sop: "knowledge.sop",
  prompt: "knowledge.prompt",
  resource: "knowledge.resource",
  template: "knowledge.template",
};
