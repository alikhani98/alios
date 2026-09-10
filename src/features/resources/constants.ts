import type { TranslationKey } from "@/shared/i18n";
import type { ResourceFormat, ResourceStatus, ResourceType } from "@/shared/types";

export const RESOURCE_TYPE_OPTIONS: ReadonlyArray<{
  value: ResourceType;
  labelKey: TranslationKey;
}> = [
  { value: "book", labelKey: "resources.typeBook" },
  { value: "website", labelKey: "resources.typeWebsite" },
  { value: "course", labelKey: "resources.typeCourse" },
  { value: "document", labelKey: "resources.typeDocument" },
  { value: "video", labelKey: "resources.typeVideo" },
];

export const RESOURCE_STATUS_OPTIONS: ReadonlyArray<{
  value: ResourceStatus;
  labelKey: TranslationKey;
}> = [
  { value: "unread", labelKey: "resources.statusUnread" },
  { value: "in_progress", labelKey: "resources.statusInProgress" },
  { value: "completed", labelKey: "resources.statusCompleted" },
  { value: "archived", labelKey: "resources.statusArchived" },
];

export const RESOURCE_FORMAT_OPTIONS: ReadonlyArray<{
  value: ResourceFormat;
  labelKey: TranslationKey;
}> = [
  { value: "physical", labelKey: "resources.formatPhysical" },
  { value: "digital", labelKey: "resources.formatDigital" },
  { value: "online", labelKey: "resources.formatOnline" },
  { value: "audio", labelKey: "resources.formatAudio" },
  { value: "video", labelKey: "resources.formatVideo" },
  { value: "other", labelKey: "resources.formatOther" },
];

export const RESOURCE_TYPE_LABEL_KEYS: Record<ResourceType, TranslationKey> = {
  book: "resources.typeBook",
  website: "resources.typeWebsite",
  course: "resources.typeCourse",
  document: "resources.typeDocument",
  video: "resources.typeVideo",
};

export const RESOURCE_FORMAT_LABEL_KEYS: Record<
  ResourceFormat,
  TranslationKey
> = {
  physical: "resources.formatPhysical",
  digital: "resources.formatDigital",
  online: "resources.formatOnline",
  audio: "resources.formatAudio",
  video: "resources.formatVideo",
  other: "resources.formatOther",
};
